import xlsx from 'node-xlsx';

class ImportacionXLSXService {
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

    async convertirXLSXaJSON(buffer) {
        try {  
            if (!buffer || buffer.length === 0) {
                throw new Error('Archivo vacío o no válido');
            }

            const workSheetsFromBuffer = xlsx.parse(buffer);
            
            if (!workSheetsFromBuffer || workSheetsFromBuffer.length === 0) {
                throw new Error('El archivo Excel no contiene hojas de cálculo');
            }

            const worksheet = workSheetsFromBuffer[0];
           
            const data = worksheet.data;
            if (!data || data.length === 0) {
                throw new Error('La hoja de Excel está vacía');
            }
            const headers = data[0];
            const columnasRequeridas = ['Fecha', 'Descripción', 'Monto', 'Moneda'];
            const columnasFaltantes = columnasRequeridas.filter(col => !headers.includes(col));
            
            if (columnasFaltantes.length > 0) {
                throw new Error(`Columnas faltantes: ${columnasFaltantes.join(', ')}. Se requieren: ${columnasRequeridas.join(', ')}`);
            }

            const indices = {
                fecha: headers.indexOf('Fecha'),
                descripcion: headers.indexOf('Descripción'),
                monto: headers.indexOf('Monto'),
                moneda: headers.indexOf('Moneda')
            };

            const resultados = [];
            const errores = [];

            for (let i = 1; i < data.length; i++) {
                const numeroLinea = i + 1; 
                const row = data[i];

                if (!row || row.length === 0 || row.every(cell => !cell)) {
                    continue;
                }

                const transaccion = {
                    fecha: (row[indices.fecha] || '').toString().trim(),
                    descripcion: (row[indices.descripcion] || '').toString().trim(),
                    monto: (row[indices.monto] || '').toString().trim(),
                    moneda: (row[indices.moneda] || '').toString().trim()
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
            }
            if (resultados.length === 0) {
                throw new Error(`No se procesó ninguna transacción válida. ${errores.length} `);
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

            return {
                transacciones: resultados,
                resumen: resumen,
                errores: errores
            };

        } catch (error) {
            console.error('Error: ', error);
            throw new Error(`Error procesando archivo Excel: ${error.message}`);
        }
    }

    obtenerDatosImportados() {
        return {
            success: true,
            transacciones: this.datosImportados,
            cantidad: this.datosImportados.length
        };
    }

    exportarAXLSX() {
        try {
            if (!this.datosImportados || this.datosImportados.length === 0) {
                throw new Error('No hay transacciones importadas para exportar');
            }

            const data = [];
            
            data.push(['Fecha', 'Descripción', 'Monto', 'Moneda', 'Fecha Importación']);

            this.datosImportados.forEach(transaccion => {
                data.push([
                    transaccion.fecha,
                    transaccion.descripcion,
                    transaccion.monto,
                    transaccion.moneda,
                    transaccion.fechaImportacion.split('T')[0] 
                ]);
            });

            const buffer = xlsx.build([{
                name: 'Transacciones',
                data: data
            }]);

            return {
                buffer: buffer,
                filename: `transacciones_exportadas_${new Date().toISOString().split('T')[0]}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };

        } catch (error) {
            console.error('Error: ', error);
            throw new Error(`Error exportando archivo Excel: ${error.message}`);
        }
    }
}

export default new ImportacionXLSXService();