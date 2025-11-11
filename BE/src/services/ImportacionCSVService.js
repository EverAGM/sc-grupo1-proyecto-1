import csv from 'csv-parser';
import { Readable } from 'stream';

class ImportacionCSVService {
    constructor() {
        this.datosImportados = [];
        this.monedasValidas = ['USD', 'EUR', 'COP', 'MXN', 'PEN', 'ARS', 'CLP', 'BRL'];
    }
    
    validarFecha(fechaStr) {
        if (!fechaStr) return false;
      
        const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
        if (!regexFecha.test(fechaStr)) return false;
        
        const fecha = new Date(fechaStr + 'T00:00:00.000Z');
        return !isNaN(fecha.getTime());
    }

    validarMonto(montoStr) {
        if (!montoStr) return false;
        const monto = parseFloat(montoStr.toString().replace(',', '.'));
        return !isNaN(monto) && monto > 0;
    }

    validarMoneda(monedaStr) {
        if (!monedaStr) return false;
        return this.monedasValidas.includes(monedaStr.toString().toUpperCase());
    }

    async convertirCSVaJSON(buffer) {
        return new Promise((resolve, reject) => {
            try {
                if (!buffer || buffer.length === 0) {
                    return reject(new Error('Archivo vacío o no válido'));
                }
                const csvContent = buffer.toString('utf8');
               
                const resultados = [];
                const errores = [];
                let numeroLinea = 0;

                const stream = Readable.from(csvContent);

                stream
                .pipe(csv({
                    separator: ',',
                    mapHeaders: ({ header }) => header.trim(),
                    skipEmptyLines: true
                }))
                .on('headers', (headers) => {
                    const columnasRequeridas = ['Fecha', 'Descripción', 'Monto', 'Moneda'];
                    const columnasFaltantes = columnasRequeridas.filter(col => !headers.includes(col));
                    
                    if (columnasFaltantes.length > 0) {
                        return reject(new Error(`Columnas faltantes: ${columnasFaltantes.join(', ')}. Se requieren: ${columnasRequeridas.join(', ')}`));
                    }
                })
                .on('data', (row) => {
                    numeroLinea++;
                    const transaccion = {
                        fecha: row['Fecha']?.toString().trim(),
                        descripcion: row['Descripción']?.toString().trim(),
                        monto: row['Monto']?.toString().trim(),
                        moneda: row['Moneda']?.toString().trim()
                    };

                    const erroresLinea = [];
                    if (!transaccion.fecha) {
                        erroresLinea.push('Fecha vacía');
                    } else if (!this.validarFecha(transaccion.fecha)) {
                        erroresLinea.push(`Fecha inválida: "${transaccion.fecha}". Usar formato YYYY-MM-DD`);
                    }

                    if (!transaccion.descripcion) {
                        erroresLinea.push('Descripción vacía');
                    } else if (transaccion.descripcion.length < 3) {
                        erroresLinea.push('Descripción muy corta (mínimo 3 caracteres)');
                    }

                    if (!transaccion.monto) {
                        erroresLinea.push('Monto vacío');
                    } else if (!this.validarMonto(transaccion.monto)) {
                        erroresLinea.push(`Monto inválido: "${transaccion.monto}". Debe ser un número positivo`);
                    }

                    if (!transaccion.moneda) {
                        erroresLinea.push('Moneda vacía');
                    } else if (!this.validarMoneda(transaccion.moneda)) {
                        erroresLinea.push(`Moneda inválida: "${transaccion.moneda}". Válidas: ${this.monedasValidas.join(', ')}`);
                    }

                    if (erroresLinea.length > 0) {
                        errores.push({
                            linea: numeroLinea,
                            errores: erroresLinea,
                            datos: transaccion
                        });
                    } else {
                    
                        const transaccionFinal = {
                            id: `txn_${Date.now()}_${numeroLinea}`,
                            fecha: transaccion.fecha,
                            descripcion: transaccion.descripcion,
                            monto: parseFloat(transaccion.monto.replace(',', '.')),
                            moneda: transaccion.moneda.toUpperCase(),
                            fechaImportacion: new Date().toISOString(),
                            numeroLinea
                        };
                        
                        resultados.push(transaccionFinal);
                    }
                })
                .on('end', () => {
                    if (resultados.length === 0) {
                        return reject(new Error(`No se procesó ninguna transacción válida. ${errores.length} errores encontrados.`));
                    }

                    const totalMonto = resultados.reduce((sum, t) => sum + t.monto, 0);
                    const monedasUsadas = [...new Set(resultados.map(t => t.moneda))];
                    const fechas = resultados.map(t => new Date(t.fecha));
                    const fechaMin = new Date(Math.min(...fechas));
                    const fechaMax = new Date(Math.max(...fechas));

                    const resumen = {
                        montoTotal: totalMonto,
                        monedasUsadas,
                        periodoFechas: {
                            desde: fechaMin.toISOString().split('T')[0],
                            hasta: fechaMax.toISOString().split('T')[0]
                        }
                    };

                    this.datosImportados = resultados;
                    
                    resolve({
                        transacciones: resultados,
                        resumen: resumen,
                        errores: errores
                    });
                })
                .on('error', (error) => {
                    console.error('Error procesando CSV:', error);
                    reject(new Error(`Error en CSV: ${error.message}`));
                });

            } catch (error) {
                console.error('Error general:', error);
                reject(new Error(`Error procesando archivo: ${error.message}`));
            }
        });
    }

    obtenerDatosImportados() {
        return {
            success: true,
            transacciones: this.datosImportados,
            cantidad: this.datosImportados.length
        };
    }
}

export default new ImportacionCSVService();