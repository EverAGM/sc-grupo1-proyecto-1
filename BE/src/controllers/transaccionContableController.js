import transaccionContableService from "../services/transaccionContableService.js";

export const crearTransaccionContable = async (req, res) => {
  try {
    const { cuenta_id, monto, tipo_transaccion, partida_diaria_id } = req.body;

    if (!cuenta_id || !monto || !tipo_transaccion || !partida_diaria_id) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos",
      });
    }

    if (tipo_transaccion !== "DEBE" && tipo_transaccion !== "HABER") {
      return res.status(400).json({
        success: false,
        message: "Tipo de transacción inválido. Debe ser 'DEBE' o 'HABER'",
      });
    }

    const nuevaTransaccion = await transaccionContableService.crearTransaccionContable({
      cuenta_id,
      monto,
      tipo_transaccion,
      partida_diaria_id,
    });

    res.status(201).json({
      success: true,
      message: "Transacción contable creada exitosamente",
      data: nuevaTransaccion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
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