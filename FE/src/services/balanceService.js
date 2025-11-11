const API_URL = "http://localhost:3000/api";

// Servicio para la verificación de balance contable
export const obtenerBalanceContable = async () => {
  try {
    // Obtener todas las transacciones contables
    const response = await fetch(`${API_URL}/transacciones-contables`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener transacciones');
    }

    const transacciones = data.data || [];
    
    // Calcular totales debe y haber
    const totalDebe = transacciones
      .filter(t => t.tipo_transaccion === 'DEBE')
      .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);
    
    const totalHaber = transacciones
      .filter(t => t.tipo_transaccion === 'HABER')
      .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);

    // Verificar si está balanceado
    const cuadrado = Math.abs(totalDebe - totalHaber) < 0.01; // Tolerancia para decimales

    // Detectar transacciones incompletas
    const transaccionesIncompletas = detectarTransaccionesIncompletas(transacciones);

    return {
      success: true,
      data: {
        debe: totalDebe,
        haber: totalHaber,
        cuadrado,
        diferencia: totalDebe - totalHaber,
        transaccionesIncompletas,
        totalTransacciones: transacciones.length,
        fechaVerificacion: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error en obtenerBalanceContable:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Función para detectar problemas en las transacciones
export const detectarTransaccionesIncompletas = (transacciones) => {
  const problemas = [];

  transacciones.forEach(transaccion => {
    const {
      id_transaccion,
      cuenta_id,
      monto,
      tipo_transaccion,
      partida_diaria_id
    } = transaccion;

    // Verificar transacciones sin partida diaria
    if (!partida_diaria_id) {
      problemas.push({
        id: `no-partida-${id_transaccion}`,
        tipo: 'SIN_PARTIDA',
        descripcion: `Transacción #${id_transaccion} sin partida diaria asignada`,
        transaccionId: id_transaccion,
        detalles: { cuenta_id, monto, tipo_transaccion }
      });
    }

    // Verificar montos inválidos
    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      problemas.push({
        id: `monto-invalido-${id_transaccion}`,
        tipo: 'MONTO_INVALIDO',
        descripcion: `Transacción #${id_transaccion} tiene monto inválido: ${monto}`,
        transaccionId: id_transaccion,
        detalles: { cuenta_id, monto, tipo_transaccion }
      });
    }

    // Verificar cuenta sin ID válida
    if (!cuenta_id) {
      problemas.push({
        id: `cuenta-invalida-${id_transaccion}`,
        tipo: 'CUENTA_INVALIDA',
        descripcion: `Transacción #${id_transaccion} sin cuenta contable asignada`,
        transaccionId: id_transaccion,
        detalles: { cuenta_id, monto, tipo_transaccion }
      });
    }

    // Verificar tipo de transacción inválido
    if (!tipo_transaccion || (tipo_transaccion !== 'DEBE' && tipo_transaccion !== 'HABER')) {
      problemas.push({
        id: `tipo-invalido-${id_transaccion}`,
        tipo: 'TIPO_INVALIDO',
        descripcion: `Transacción #${id_transaccion} tiene tipo inválido: ${tipo_transaccion}`,
        transaccionId: id_transaccion,
        detalles: { cuenta_id, monto, tipo_transaccion }
      });
    }
  });

  return problemas;
};

// Función para obtener detalles de una transacción específica
export const obtenerDetalleTransaccion = async (transaccionId) => {
  try {
    const response = await fetch(`${API_URL}/transacciones-contables/${transaccionId}`);
    const data = await response.json();
    
    return data.success ? data.data : null;
  } catch (error) {
    console.error(`Error al obtener transacción ${transaccionId}:`, error);
    return null;
  }
};

// Función para recalcular balance (útil después de hacer cambios)
export const recalcularBalance = async () => {
  return await obtenerBalanceContable();
};

// Función para verificar integridad del sistema contable
export const verificarIntegridadContable = async () => {
  try {
    const balance = await obtenerBalanceContable();
    
    if (!balance.success) {
      return balance;
    }

    const { cuadrado, transaccionesIncompletas } = balance.data;
    
    // Criterios de integridad
    const integridad = {
      balanceado: cuadrado,
      sinProblemas: transaccionesIncompletas.length === 0,
      totalProblemas: transaccionesIncompletas.length,
      problemasDesglosados: {
        sinPartida: transaccionesIncompletas.filter(p => p.tipo === 'SIN_PARTIDA').length,
        montoInvalido: transaccionesIncompletas.filter(p => p.tipo === 'MONTO_INVALIDO').length,
        cuentaInvalida: transaccionesIncompletas.filter(p => p.tipo === 'CUENTA_INVALIDA').length,
        tipoInvalido: transaccionesIncompletas.filter(p => p.tipo === 'TIPO_INVALIDO').length
      }
    };

    return {
      success: true,
      data: {
        ...balance.data,
        integridad
      }
    };
    
  } catch (error) {
    console.error('Error al verificar integridad:', error);
    return {
      success: false,
      error: error.message
    };
  }
};