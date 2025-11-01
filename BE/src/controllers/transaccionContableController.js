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