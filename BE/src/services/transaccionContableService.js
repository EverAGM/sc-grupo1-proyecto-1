import db from "../database/db.js";

class TransaccionContableService {
  async crearTransaccionContable(datos) {
    const {cuenta_id, monto, tipo_transaccion, partida_diaria_id } = datos;

    // Validar los datos
    if (!cuenta_id || !monto || !tipo_transaccion || !partida_diaria_id) {
      throw new Error("Faltan datos requeridos");
    }

    const result = await db.query(
      `INSERT INTO transacciones_contables 
         (cuenta_id, monto, tipo_transaccion, partida_diaria_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,[cuenta_id, monto, tipo_transaccion, partida_diaria_id]
    );  
    return result.rows[0];
  }
}

export default new TransaccionContableService();
