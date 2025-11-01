import db from "../database/db.js";

class PeriodoContableService {
    async crearPeriodoContable(datos) {
        const { fecha_inicio, fecha_fin, estado } = datos;
        
        if (!fecha_inicio || !fecha_fin || !estado) {
            throw new Error("Faltan datos obligatorios para crear el periodo contable");
        }

        const result = await db.query(
            `INSERT INTO periodos_contables 
             (fecha_inicio, fecha_fin, estado) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [fecha_inicio, fecha_fin, estado]
        );

        return result.rows[0];
    }

    async obtenerPeriodoPorId(id) {
        const result = await db.query(
            "SELECT * FROM periodos_contables WHERE id_periodo = $1",
            [id]
        );

        return result.rows[0];
    }

    async obtenerTodosPeriodos() {
        const result = await db.query("SELECT * FROM periodos_contables");
        return result.rows;
    }

}

export default new PeriodoContableService();