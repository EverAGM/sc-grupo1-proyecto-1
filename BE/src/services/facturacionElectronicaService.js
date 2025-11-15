import db from "../database/db.js";
import periodoContableService from "./periodoContableService.js";

class FacturacionElectronicaService {
  async crearFacturaElectronica(datos) {
    const { numero_factura, fecha_emision, cliente_nombre, subtotal, impuestos, total, estado_fe, cufe, id_periodo, descripcion } = datos;

    
    const periodo = await periodoContableService.obtenerPeriodoPorId(id_periodo);
    if (!periodo) {
      throw new Error("PeriodoContableNotFound");
    }

    if (!numero_factura || !fecha_emision || !cliente_nombre || !subtotal || !impuestos || !total || !id_periodo) {
      throw new Error("Faltan datos requeridos");
    }

   
    const totalCalculado = parseFloat(subtotal) + parseFloat(impuestos);
    if (Math.abs(totalCalculado - parseFloat(total)) > 0.01) {
      throw new Error("El total no coincide con la suma de subtotal e impuestos");
    }

    const result = await db.query(
      `INSERT INTO facturas_electronicas 
         (numero_factura, fecha_emision, cliente_nombre, subtotal, impuestos, total, estado_fe, cufe, id_periodo, descripcion) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
      [numero_factura, fecha_emision, cliente_nombre, subtotal, impuestos, total, estado_fe || 'BORRADOR', cufe, id_periodo, descripcion]
    );  
    return result.rows[0];
  }

  async obtenerFacturaPorId(id) {
    const result = await db.query(
      "SELECT * FROM facturas_electronicas WHERE id_factura_electronica = $1",
      [id]
    );
    return result.rows[0];
  }

  async obtenerTodasFacturas() {
    const result = await db.query(
      `SELECT fe.*, p.fecha_inicio AS periodo_fecha_inicio, p.fecha_fin AS periodo_fecha_fin, p.estado AS periodo_estado
       FROM facturas_electronicas fe
       LEFT JOIN periodos_contables p ON fe.id_periodo = p.id_periodo
       ORDER BY fe.fecha_emision DESC`
    );
    return result.rows;
  }

  async obtenerFacturasPorPeriodo(id_periodo) {
    const result = await db.query(
      `SELECT fe.*, p.fecha_inicio AS periodo_fecha_inicio, p.fecha_fin AS periodo_fecha_fin, p.estado AS periodo_estado
       FROM facturas_electronicas fe
       LEFT JOIN periodos_contables p ON fe.id_periodo = p.id_periodo
       WHERE fe.id_periodo = $1
       ORDER BY fe.fecha_emision DESC`,
      [id_periodo]
    );
    return result.rows;
  }

  async eliminarFacturaElectronica(id) {
    const result = await db.query(
      `DELETE FROM facturas_electronicas WHERE id_factura_electronica = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async actualizarFacturaElectronica(id, datos) {
    const { numero_factura, fecha_emision, cliente_nombre, subtotal, impuestos, total, estado_fe, cufe, id_periodo, descripcion } = datos;

   
    if (subtotal && impuestos && total) {
      const totalCalculado = parseFloat(subtotal) + parseFloat(impuestos);
      if (Math.abs(totalCalculado - parseFloat(total)) > 0.01) {
        throw new Error("El total no coincide con la suma de subtotal e impuestos");
      }
    }

    const result = await db.query(
      `UPDATE facturas_electronicas 
         SET numero_factura = $1, fecha_emision = $2, cliente_nombre = $3, subtotal = $4, 
             impuestos = $5, total = $6, estado_fe = $7, cufe = $8, id_periodo = $9, descripcion = $10
         WHERE id_factura_electronica = $11
         RETURNING *`,
      [numero_factura, fecha_emision, cliente_nombre, subtotal, impuestos, total, estado_fe, cufe, id_periodo, descripcion, id]
    );
    return result.rows[0];  
  }
}

export default new FacturacionElectronicaService();