import facturacionElectronicaService from "../services/facturacionElectronicaService.js";

export const crearFacturaElectronica = async (req, res) => {
  try {
    const { numero_factura, fecha_emision, cliente_nombre, subtotal, impuestos, total, estado_fe, cufe, id_periodo, descripcion } = req.body;

    if (!numero_factura || !fecha_emision || !cliente_nombre || !subtotal || !impuestos || !total || !id_periodo) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos: numero_factura, fecha_emision, cliente_nombre, subtotal, impuestos, total, id_periodo",
      });
    }

   
    if (estado_fe && !['BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'ANULADA'].includes(estado_fe)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido. Debe ser 'BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA' o 'ANULADA'",
      });
    }

    const id_periodo_num = parseInt(id_periodo);
    if (isNaN(id_periodo_num) || id_periodo_num <= 0) {
      return res.status(400).json({
        success: false,
        message: "El id del período debe ser un entero positivo",
      });
    }

    const subtotal_num = parseFloat(subtotal);
    if (isNaN(subtotal_num) || subtotal_num < 0) {
      return res.status(400).json({
        success: false,
        message: "El subtotal debe ser un número positivo o cero",
      });
    }

    const impuestos_num = parseFloat(impuestos);
    if (isNaN(impuestos_num) || impuestos_num < 0) {
      return res.status(400).json({
        success: false,
        message: "Los impuestos deben ser un número positivo o cero",
      });
    }

    const total_num = parseFloat(total);
    if (isNaN(total_num) || total_num <= 0) {
      return res.status(400).json({
        success: false,
        message: "El total debe ser un número positivo",
      });
    }

    const nuevaFactura = await facturacionElectronicaService.crearFacturaElectronica({
      numero_factura,
      fecha_emision,
      cliente_nombre,
      subtotal,
      impuestos,
      total,
      estado_fe,
      cufe,
      id_periodo,
      descripcion,
    });

    res.status(201).json({
      success: true,
      message: "Factura electrónica creada exitosamente",
      data: nuevaFactura,
    });
  } catch (error) {
    console.error("Error al crear factura electrónica:", error.message);

    if (error.message.includes('PeriodoContableNotFound')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('total no coincide')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

export const obtenerFacturaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const factura = await facturacionElectronicaService.obtenerFacturaPorId(id);

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: "Factura electrónica no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: factura,
    });
  } catch (error) {
    console.error("Error al obtener factura electrónica:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};  

export const verFacturasElectronicas = async (req, res) => {
  try {
    const facturas = await facturacionElectronicaService.obtenerTodasFacturas();
    res.status(200).json({
      success: true,
      data: facturas,
    });
  } catch (error) {
    console.error("Error al obtener facturas electrónicas:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

export const obtenerFacturasPorPeriodo = async (req, res) => {
  try {
    const { id_periodo } = req.params;
    const facturas = await facturacionElectronicaService.obtenerFacturasPorPeriodo(id_periodo);
    res.status(200).json({
      success: true,
      data: facturas,
    });
  } catch (error) {
    console.error("Error al obtener facturas por período:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

export const eliminarFacturaElectronica = async (req, res) => {
  try {
    const { id } = req.params;

    const facturaEliminada = await facturacionElectronicaService.eliminarFacturaElectronica(id);

    if (!facturaEliminada) {
      return res.status(404).json({
        success: false,
        message: 'Factura electrónica no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Factura electrónica eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar factura electrónica:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const actualizarFacturaElectronica = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero_factura, fecha_emision, cliente_nombre, subtotal, impuestos, total, estado_fe, cufe, id_periodo, descripcion } = req.body;

    if (!numero_factura || !fecha_emision || !cliente_nombre || !subtotal || !impuestos || !total || !id_periodo) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    const facturaActualizada = await facturacionElectronicaService.actualizarFacturaElectronica(id, {
      numero_factura,
      fecha_emision,
      cliente_nombre,
      subtotal,
      impuestos,
      total,
      estado_fe,
      cufe,
      id_periodo,
      descripcion
    });

    if (!facturaActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Factura electrónica no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Factura electrónica actualizada exitosamente',
      data: facturaActualizada
    });
  } catch (error) {
    console.error('Error al actualizar factura electrónica:', error);
    
    if (error.message.includes('total no coincide')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
