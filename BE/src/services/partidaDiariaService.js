import db from "../database/db.js"

class PartidaDiariaService {
  async crearPartidaDiaria(datos) {
    const { concepto, estado, id_periodo} = datos;

    if (!concepto || !id_periodo) {
      throw new Error("Concepto e ID de periodo son obligatorios");
    }

    const result = await db.query(
      `INSERT INTO partida_diaria
         (concepto, estado, id_periodo) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
      [concepto, estado || 'PENDIENTE', id_periodo]
    );
    return result.rows[0];
  }

  async obtenerPartidaPorId(id) {
    const result = await db.query(
      `SELECT * FROM partida_diaria WHERE id_partida_diaria = $1`,
      [id]
    );
    return result.rows[0];
  }

  async obtenerTodasPartidas() {
    const result = await db.query(
      `SELECT * FROM partida_diaria`
    );
    return result.rows;
  }
}

export default new PartidaDiariaService();