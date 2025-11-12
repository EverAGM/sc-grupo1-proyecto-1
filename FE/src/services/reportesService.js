// Servicio para reportes con datos reales
import * as XLSX from 'xlsx';
import { obtenerBalanceContable } from './balanceService';

const API_BASE_URL = 'http://localhost:3000/api';

// Funciones auxiliares
const fetchAPIData = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`Error al obtener datos de ${endpoint}`);
  }
  
  return data.data || [];
};

const crearMapaCuentas = (cuentas) => {
  const mapa = {};
  cuentas.forEach(cuenta => {
    mapa[cuenta.id_cuenta] = {
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      categoria: cuenta.categoria
    };
  });
  return mapa;
};

const calcularSaldosPorCuenta = (transacciones) => {
  const cuentasSaldos = {};
  
  transacciones.forEach(t => {
    if (!cuentasSaldos[t.cuenta_id]) {
      cuentasSaldos[t.cuenta_id] = {
        cuenta_id: t.cuenta_id,
        debe: 0,
        haber: 0,
        saldo: 0
      };
    }
    
    const monto = parseFloat(t.monto) || 0;
    if (t.tipo_transaccion === 'DEBE') {
      cuentasSaldos[t.cuenta_id].debe += monto;
    } else if (t.tipo_transaccion === 'HABER') {
      cuentasSaldos[t.cuenta_id].haber += monto;
    }
  });

  // Calcular saldo final por cuenta
  Object.values(cuentasSaldos).forEach(cuenta => {
    cuenta.saldo = cuenta.debe - cuenta.haber;
  });

  return cuentasSaldos;
};

const formatearMoneda = (valor) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(valor);
};

const agregarSeccionBalance = (balanceData, titulo, cuentas, emoji = '') => {
  if (cuentas.length === 0) {
    balanceData.push([''], [`${emoji} ${titulo} - Sin movimientos`], ['']);
    return;
  }

  balanceData.push(
    [''],
    ['═══════════════════════════════════════════════════════════════════════'],
    [`${emoji} ${titulo}`],
    ['═══════════════════════════════════════════════════════════════════════'],
    ['Código', 'Nombre de la Cuenta', 'DEBE', 'HABER', 'SALDO FINAL']
  );

  cuentas.forEach(cuenta => {
    balanceData.push([
      cuenta.codigo,
      cuenta.nombre,
      formatearMoneda(cuenta.debe),
      formatearMoneda(cuenta.haber),
      formatearMoneda(cuenta.saldo)
    ]);
  });

  const totalSeccion = cuentas.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
  balanceData.push(
    ['───────────────────────────────────────────────────────────────────────'],
    ['', `TOTAL ${titulo.toUpperCase()}:`, '', '', formatearMoneda(totalSeccion)],
    ['═══════════════════════════════════════════════════════════════════════']
  );
};

const clasificarCuentaPorTipo = (cuenta, mapaCuentas, reporteData) => {
  const infoCuenta = mapaCuentas[cuenta.cuenta_id];
  
  if (!infoCuenta) {
    console.warn(`Cuenta ${cuenta.cuenta_id} no encontrada en el catálogo de cuentas`);
    return;
  }

  const cuentaInfo = {
    codigo: infoCuenta.codigo,
    nombre: infoCuenta.nombre,
    debe: cuenta.debe,
    haber: cuenta.haber,
    saldo: Math.abs(cuenta.saldo),
    tipo: infoCuenta.tipo
  };

  switch (infoCuenta.tipo.toUpperCase()) {
    case 'ACTIVO':
      reporteData.balance.activos.push(cuentaInfo);
      reporteData.resumen.totalActivos += cuentaInfo.saldo;
      break;
      
    case 'PASIVO':
      reporteData.balance.pasivos.push(cuentaInfo);
      reporteData.resumen.totalPasivos += cuentaInfo.saldo;
      break;
      
    case 'PATRIMONIO':
      reporteData.balance.patrimonio.push(cuentaInfo);
      reporteData.resumen.totalPatrimonio += cuentaInfo.saldo;
      break;
      
    default:
      console.warn(`Tipo de cuenta desconocido: ${infoCuenta.tipo} para cuenta ${cuenta.cuenta_id}`);
      reporteData.balance.activos.push(cuentaInfo);
      reporteData.resumen.totalActivos += cuentaInfo.saldo;
  }
};

// Generar datos de reporte basados en transacciones reales
const generarDatosReporte = async () => {
  try {
    const balanceData = await obtenerBalanceContable();
    
    if (!balanceData.success) {
      throw new Error('Error al obtener datos del balance');
    }

    // Obtener datos de transacciones y cuentas
    const transacciones = await fetchAPIData('transacciones-contables');
    const cuentas = await fetchAPIData('cuentas-contables');
    
    // Crear estructuras de datos optimizadas
    const mapaCuentas = crearMapaCuentas(cuentas);
    const cuentasSaldos = calcularSaldosPorCuenta(transacciones);

    // Generar estructura de reporte
    const reporteData = {
      balance: {
        activos: [],
        pasivos: [],
        patrimonio: []
      },
      resumen: {
        totalActivos: 0,
        totalPasivos: 0,
        totalPatrimonio: 0,
        totalDebe: balanceData.data.debe,
        totalHaber: balanceData.data.haber,
        cuadrado: balanceData.data.cuadrado
      },
      fechaGeneracion: new Date().toISOString(),
      periodo: new Date().getFullYear().toString(),
      totalTransacciones: transacciones.length
    };

    // Distribuir cuentas por tipo usando datos reales
    Object.values(cuentasSaldos).forEach(cuenta => {
      clasificarCuentaPorTipo(cuenta, mapaCuentas, reporteData);
    });

    // Ordenar las cuentas por código dentro de cada categoría
    reporteData.balance.activos.sort((a, b) => a.codigo.localeCompare(b.codigo));
    reporteData.balance.pasivos.sort((a, b) => a.codigo.localeCompare(b.codigo));
    reporteData.balance.patrimonio.sort((a, b) => a.codigo.localeCompare(b.codigo));

    return reporteData;
  } catch (error) {
    console.error('Error generando datos de reporte:', error);
    throw error; // Propagar el error para manejo en el componente
  }
};

export const obtenerEstadoReportes = async () => {
  try {
    const reporteData = await generarDatosReporte();
    
    return {
      disponible: true,
      ultimaActualizacion: new Date().toLocaleDateString(),
      periodo: reporteData.periodo,
      totalTransacciones: reporteData.totalTransacciones,
      balanceado: reporteData.resumen.cuadrado
    };
  } catch (error) {
    console.error('Error obteniendo estado de reportes:', error);
    return {
      disponible: false,
      error: error.message
    };
  }
};

export const exportarExcel = async () => {
  try {
    console.log('Generando archivo Excel con datos reales...');
    
    const reporteData = await generarDatosReporte();
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    // Hoja 1: Balance General con formato profesional
    const balanceData = [
      ['BALANCE GENERAL'],
      [`Fecha de Generación: ${new Date(reporteData.fechaGeneracion).toLocaleDateString('es-ES')}`],
      [`Período Contable: ${reporteData.periodo}`],
      [`Total de Transacciones: ${reporteData.totalTransacciones}`]
    ];
    
    // Agregar secciones del balance usando función auxiliar
    agregarSeccionBalance(balanceData, 'ACTIVOS', reporteData.balance.activos, '🏛️');
    agregarSeccionBalance(balanceData, 'PASIVOS', reporteData.balance.pasivos, '💳');
    agregarSeccionBalance(balanceData, 'PATRIMONIO', reporteData.balance.patrimonio, '💰');
    
    // Resumen final
    balanceData.push(
      [''],
      ['═══════════════════════════════════════════════════════════════════════'],
      ['📊 RESUMEN EJECUTIVO'],
      ['═══════════════════════════════════════════════════════════════════════'],
      ['DEBE Total:', formatearMoneda(reporteData.resumen.totalDebe)],
      ['HABER Total:', formatearMoneda(reporteData.resumen.totalHaber)],
      ['Balance Cuadrado:', reporteData.resumen.cuadrado ? '✅ SÍ' : '❌ NO'],
      [''],
      ['───────────────────────────────────────────────────────────'],
      ['    Reporte generado automáticamente por el sistema    '],
      ['───────────────────────────────────────────────────────────']
    );
    
    // Crear hoja de cálculo
    const ws = XLSX.utils.aoa_to_sheet(balanceData);
    
    // Configurar estilos y formato
    ws['!cols'] = [
      { width: 12 }, // Código
      { width: 35 }, // Nombre
      { width: 18 }, // Debe
      { width: 18 }, // Haber
      { width: 20 }  // Saldo
    ];
    
    // Configurar merge para título principal
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { c: 0, r: 0 }, e: { c: 4, r: 0 } }); // BALANCE GENERAL
    ws['!merges'].push({ s: { c: 0, r: 1 }, e: { c: 4, r: 1 } }); // Fecha
    ws['!merges'].push({ s: { c: 0, r: 2 }, e: { c: 4, r: 2 } }); // Período
    
    // Aplicar formato especial al título
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, size: 16, name: 'Arial' },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
    
    XLSX.utils.book_append_sheet(wb, ws, 'Balance General');
    
    // Generar archivo
    const filename = `balance-general-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    return {
      success: true,
      data: {
        filename,
        size: 'Generado',
        totalCuentas: reporteData.balance.activos.length + reporteData.balance.pasivos.length + reporteData.balance.patrimonio.length
      },
      message: `Excel generado exitosamente: ${filename}`
    };
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const exportarHTML = async () => {
  try {
    console.log('Generando archivo HTML con datos reales...');
    
    const reporteData = await generarDatosReporte();
    
    // Generar contenido HTML
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Balance General - ${reporteData.periodo}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
        }
        .header h1 { 
            color: #1e40af; 
            margin: 0;
        }
        .meta-info {
            margin: 10px 0;
            color: #6b7280;
        }
        .section { 
            margin: 20px 0; 
        }
        .section h2 { 
            background: #f3f4f6; 
            padding: 10px; 
            margin: 0 0 10px 0;
            color: #1f2937;
            border-left: 4px solid #3b82f6;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
        }
        th, td { 
            border: 1px solid #d1d5db; 
            padding: 8px 12px; 
            text-align: left;
        }
        th { 
            background-color: #f9fafb; 
            font-weight: 600;
            color: #374151;
        }
        .currency { 
            text-align: right;
            font-family: monospace;
        }
        .total-row { 
            font-weight: bold; 
            background-color: #f3f4f6;
        }
        .resumen { 
            background: #f8fafc; 
            border: 2px solid #e5e7eb; 
            padding: 20px; 
            border-radius: 8px;
            margin-top: 30px;
        }
        .status-cuadrado { 
            color: #16a34a; 
            font-weight: bold;
        }
        .status-descuadrado { 
            color: #dc2626; 
            font-weight: bold;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>BALANCE GENERAL</h1>
        <div class="meta-info">
            <p>Fecha de generación: ${new Date(reporteData.fechaGeneracion).toLocaleDateString()}</p>
            <p>Período: ${reporteData.periodo}</p>
            <p>Total de transacciones: ${reporteData.totalTransacciones}</p>
        </div>
    </div>

    ${reporteData.balance.activos.length > 0 ? `
    <div class="section">
        <h2>ACTIVOS</h2>
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre de la Cuenta</th>
                    <th>Debe</th>
                    <th>Haber</th>
                    <th>Saldo</th>
                </tr>
            </thead>
            <tbody>
                ${reporteData.balance.activos.map(cuenta => `
                <tr>
                    <td>${cuenta.codigo}</td>
                    <td>${cuenta.nombre}</td>
                    <td class="currency">$${cuenta.debe.toLocaleString()}</td>
                    <td class="currency">$${cuenta.haber.toLocaleString()}</td>
                    <td class="currency">$${cuenta.saldo.toLocaleString()}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="4"><strong>TOTAL ACTIVOS</strong></td>
                    <td class="currency"><strong>$${reporteData.resumen.totalActivos.toLocaleString()}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>
    ` : ''}

    ${reporteData.balance.pasivos.length > 0 ? `
    <div class="section">
        <h2>PASIVOS</h2>
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre de la Cuenta</th>
                    <th>Debe</th>
                    <th>Haber</th>
                    <th>Saldo</th>
                </tr>
            </thead>
            <tbody>
                ${reporteData.balance.pasivos.map(cuenta => `
                <tr>
                    <td>${cuenta.codigo}</td>
                    <td>${cuenta.nombre}</td>
                    <td class="currency">$${cuenta.debe.toLocaleString()}</td>
                    <td class="currency">$${cuenta.haber.toLocaleString()}</td>
                    <td class="currency">$${cuenta.saldo.toLocaleString()}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="4"><strong>TOTAL PASIVOS</strong></td>
                    <td class="currency"><strong>$${reporteData.resumen.totalPasivos.toLocaleString()}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>
    ` : ''}

    ${reporteData.balance.patrimonio.length > 0 ? `
    <div class="section">
        <h2>PATRIMONIO</h2>
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre de la Cuenta</th>
                    <th>Debe</th>
                    <th>Haber</th>
                    <th>Saldo</th>
                </tr>
            </thead>
            <tbody>
                ${reporteData.balance.patrimonio.map(cuenta => `
                <tr>
                    <td>${cuenta.codigo}</td>
                    <td>${cuenta.nombre}</td>
                    <td class="currency">$${cuenta.debe.toLocaleString()}</td>
                    <td class="currency">$${cuenta.haber.toLocaleString()}</td>
                    <td class="currency">$${cuenta.saldo.toLocaleString()}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="4"><strong>TOTAL PATRIMONIO</strong></td>
                    <td class="currency"><strong>$${reporteData.resumen.totalPatrimonio.toLocaleString()}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="resumen">
        <h2>RESUMEN CONTABLE</h2>
        <table>
            <tr>
                <td><strong>Total DEBE:</strong></td>
                <td class="currency"><strong>$${reporteData.resumen.totalDebe.toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td><strong>Total HABER:</strong></td>
                <td class="currency"><strong>$${reporteData.resumen.totalHaber.toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td><strong>Estado del Balance:</strong></td>
                <td class="${reporteData.resumen.cuadrado ? 'status-cuadrado' : 'status-descuadrado'}">
                    <strong>${reporteData.resumen.cuadrado ? 'CUADRADO ✓' : 'DESCUADRADO ⚠'}</strong>
                </td>
            </tr>
        </table>
    </div>

    <div class="no-print" style="margin-top: 30px; text-align: center; color: #6b7280;">
        <p>Documento generado automáticamente el ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;

    // Crear y descargar archivo HTML
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const filename = `balance-general-${new Date().toISOString().split('T')[0]}.html`;
    
    descargarArchivo(URL.createObjectURL(blob), filename);
    
    return {
      success: true,
      data: {
        filename,
        size: `${Math.round(blob.size / 1024)} KB`,
        totalCuentas: reporteData.balance.activos.length + reporteData.balance.pasivos.length + reporteData.balance.patrimonio.length
      },
      message: 'Archivo HTML generado y descargado correctamente'
    };
    
  } catch (error) {
    console.error('Error al exportar HTML:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al generar el archivo HTML'
    };
  }
};

export const obtenerDatosBalance = async () => {
  try {
    const reporteData = await generarDatosReporte();
    
    return {
      success: true,
      data: reporteData
    };
  } catch (error) {
    console.error('Error obteniendo datos de balance:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Función helper para descargar archivos
export const descargarArchivo = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpiar URL del objeto si es un blob
  if (url.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};