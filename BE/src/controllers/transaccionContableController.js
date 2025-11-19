import partidaDiariaService from "../services/partidaDiariaService.js";
import transaccionContableService from "../services/transaccionContableService.js";
import {patronFecha, parseFecha} from "../helpers/fechaValidator.js";
import {transaccionValidator} from "../helpers/transaccionValidator.js"

export const crearTransaccionContable = async (req, res) => {
  try {
    const { cuenta_id, monto, tipo_transaccion, partida_diaria_id, fecha_operacion } = req.body;

    const data = await transaccionValidator(req.body);

    const nuevaTransaccion = await transaccionContableService.crearTransaccionContable({
      cuenta_id: data.cuenta_id_num,
      monto: data.monto_num,
      tipo_transaccion: data.tipo_transaccion,
      partida_diaria_id:data.partida_num,
      fecha_operacion: data.fechaISO,
    });

    res.status(201).json({
      success: true,
      message: "Transacción contable creada exitosamente",
      data: nuevaTransaccion,
    });
  } catch (error) {
    console.error("Error al crear transacción contable:", error.message);
    return getThrow(error, res);
  }
};

export const obtenerTransaccionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const transaccion = await transaccionContableService.obtenerTransaccionPorId(id);

    if (!transaccion) {
      return res.status(404).json({
        success: false,
        message: "Transacción contable no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: transaccion,
    });
  } catch (error) {
    console.error("Error al obtener transacción contable:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};  

export const verTransaccionesContables = async (req, res) => {
  try {
    const transacciones = await transaccionContableService.obtenerTodasTransacciones();
    res.status(200).json({
      success: true,
      data: transacciones,
    });
  } catch (error) {
    console.error("Error al obtener transacciones contables:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

export const obtenerTransaccionesPorPartida = async (req, res) => {
  try {
    const { partida_diaria_id } = req.params;

    const partida_num = parseInt(partida_diaria_id);
    if(isNaN(partida_num) || partida_num<=0){
      return res.status(400).json({
        success : false,
        message : "El ID de la partida diaria debe ser un número entero positivo válido"
      });
    }

    const transacciones = await transaccionContableService.obtenerTransaccionesPorPartida(partida_diaria_id);
    res.status(200).json({
      success: true,
      data: transacciones,
    });
  } catch (error) {
    console.error("Error al obtener transacciones por partida diaria:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

export const eliminarTransaccionContable = async (req, res) => {
    try {
        const { id } = req.params;

        const id_num = parseInt(id);
        if(isNaN(id_num) || id_num <=0){
          return res.status(400).json({
            success: false,
            message: "El ID de la transacción debe ser un número entero positivo válido."
          });

        }
        const transaccionEliminada = await transaccionContableService.eliminarTransaccionContable(id);

        if (!transaccionEliminada) {
            return res.status(404).json({
                success: false,
                message: 'Transacción contable no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transacción contable eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar transacción contable:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const actualizarTransaccionContable = async (req, res) => {
    try {
        const { id } = req.params;
        const { cuenta_id, monto, tipo_transaccion, partida_diaria_id, fecha_operacion } = req.body;

        if (!cuenta_id || !monto || !tipo_transaccion || !partida_diaria_id || !fecha_operacion) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos'
            });
        }

        const id_num = parseInt(id);
        if(isNaN(id_num) || id_num<=0){
          return res.status(400).json({
            success : false,
            message : "El ID tiene que ser un número entero poditivo válido"
          });
        }

        const data = await transaccionValidator(req.body);

        const transaccionActualizada = await transaccionContableService.actualizarTransaccionContable(id_num, {
            cuenta_id : data.cuenta_id_num,
            monto : data.monto_num,
            tipo_transaccion : data.tipo_transaccion,
            partida_diaria_id : data.partida_num,
            fecha_operacion : data.fechaISO
        });

        if (!transaccionActualizada) {
            return res.status(404).json({
                success: false,
                message: 'Transacción contable no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transacción contable actualizada exitosamente',
            data: transaccionActualizada
        });
    } catch (error) {
        console.error('Error al actualizar transacción contable:', error);
        return getThrow(error, res);
    }
};

function getThrow(error, res){
  //Se manejan todos los throw lanzados en services o helpers
    const specificErrors = {
        'FormatoFechaInvalido': 400,
        'PartidaIdInvalido': 400,
        'FechaFueraDePeriodo': 400,
        'TipoTransaccionInvalido': 400,
        'CuentaIdInvalido': 400,
        'MontoInvalido': 400,
        'PartidaDiariaNotFound': 404,
        'CuentaContableNotFound': 404,
        'FechaNoReal' : 404,
        'DatosFaltantes' : 400
    };
    // Intenta encontrar el código mapeado; si falla, usa 500.
    const errorKey = error.message.split(':')[0].trim();
    const statusCode = specificErrors[errorKey] || 500;
    const message = (statusCode === 500) ? "Error interno del servidor" : error.message;

    return res.status(statusCode).json({
      success: false,
      message: message,
    });
}