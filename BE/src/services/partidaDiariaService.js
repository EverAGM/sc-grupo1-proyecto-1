import db from "../database/db.js"
import PeriodoContableService from './periodoContableService.js';

class PartidaDiariaService {
  async crearPartidaDiaria(datos) {
    const { concepto, estado, id_periodo} = datos;

    const periodo = await PeriodoContableService.obtenerPeriodoPorId(id_periodo);
    if(!periodo){
      throw new Error("PeriodoContableNotFound")
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