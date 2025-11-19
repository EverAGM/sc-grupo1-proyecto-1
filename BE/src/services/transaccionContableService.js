import db from "../database/db.js";
import cuentaContableService from './cuentaContableService.js';
import partidaDiariaService from "./partidaDiariaService.js";

class TransaccionContableService {
  async crearTransaccionContable(datos) {
    const {cuenta_id, monto, tipo_transaccion, partida_diaria_id, fecha_operacion } = datos;


    const cuenta_contable = await cuentaContableService.obtenerCuentaPorId(cuenta_id);
    if(!cuenta_contable){
      throw new Error("CuentaContableNotFound")
    }

    const partidaResult = await partidaDiariaService.obtenerPartidaPorId(partida_diaria_id);
    if (!partidaResult) {//se valida si no hay partida
      throw new Error("PartidaDiariaNotFound");
    }
   

    // Validar los datos
    if (!cuenta_id || !monto || !tipo_transaccion || !partida_diaria_id) {
      throw new Error("Faltan datos requeridos");
    }

    const result = await db.query(
      `INSERT INTO transacciones_contables 
         (cuenta_id, monto, tipo_transaccion, partida_diaria_id, fecha_operacion) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,[cuenta_id, monto, tipo_transaccion, partida_diaria_id, fecha_operacion]
    );  
    return result.rows[0];
  }

  async obtenerTransaccionPorId(id) {
    const result = await db.query(
      "SELECT * FROM transacciones_contables WHERE id_transaccion = $1",
      [id]
    );
    return result.rows[0];
  }

  async obtenerTodasTransacciones() {
    const result = await db.query(
      `SELECT tc.*, pd.id_partida_diaria, pd.concepto AS partida_concepto, pd.estado AS partida_estado, pd.id_periodo,
              p.fecha_inicio AS periodo_fecha_inicio, p.fecha_fin AS periodo_fecha_fin
       FROM transacciones_contables tc
       LEFT JOIN partida_diaria pd ON tc.partida_diaria_id = pd.id_partida_diaria
       LEFT JOIN periodos_contables p ON pd.id_periodo = p.id_periodo`
    );
    return result.rows;
  }

  async obtenerTransaccionesPorPartida(partida_diaria_id) {
    const result = await db.query(
      `SELECT tc.*, pd.id_partida_diaria, pd.concepto AS partida_concepto, pd.estado AS partida_estado, pd.id_periodo,
              p.fecha_inicio AS periodo_fecha_inicio, p.fecha_fin AS periodo_fecha_fin
       FROM transacciones_contables tc
       LEFT JOIN partida_diaria pd ON tc.partida_diaria_id = pd.id_partida_diaria
       LEFT JOIN periodos_contables p ON pd.id_periodo = p.id_periodo
       WHERE tc.partida_diaria_id = $1`,
      [partida_diaria_id]
    );
    return result.rows;
  }

  async eliminarTransaccionContable(id) {
    const result = await db.query(
      `DELETE FROM transacciones_contables WHERE id_transaccion = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async actualizarTransaccionContable(id, datos) {
    const { cuenta_id, monto, tipo_transaccion, partida_diaria_id, fecha_operacion } = datos;

    const result = await db.query(
      `UPDATE transacciones_contables 
         SET cuenta_id = $1, monto = $2, tipo_transaccion = $3, partida_diaria_id = $4, fecha_operacion = $5
         WHERE id_transaccion = $6
         RETURNING *`,
      [cuenta_id, monto, tipo_transaccion, partida_diaria_id, fecha_operacion, id]
    );
    return result.rows[0];  
  }
}

export default new TransaccionContableService();
