import db from "../database/db.js"

class PartidaDiariaService {
  async crearPartidaDiaria(datos) {
    const { concepto, estado, id_periodo} = datos;

    if (!concepto || !id_periodo) {
      throw new Error("Concepto e ID de periodo son obligatorios");
    }

    const result = await db.query(
      `INSERT INTO partidas_diarias 
         (concepto, estado, id_periodo) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
      [concepto, estado || 'PENDIENTE', id_periodo]
    );
    return result.rows[0];
  }
}

export default new PartidaDiariaService();