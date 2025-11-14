import db from "../database/db.js";

class PeriodoContableService {
    async crearPeriodoContable(datos) {
        const { fecha_inicio: fechaInicioISO, fecha_fin: fechaFinISO, estado } = datos;
        
        if (!fechaInicioISO || !fechaFinISO || !estado) {
            throw new Error("Faltan datos obligatorios para crear el periodo contable");
        }

        const result = await db.query(
            `INSERT INTO periodos_contables 
             (fecha_inicio, fecha_fin, estado) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [fechaInicioISO, fechaFinISO, estado]
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

    async actualizarPeriodoContable(id, datos) {
        const { fecha_inicio, fecha_fin, estado } = datos;

        const result = await db.query(
            `UPDATE periodos_contables 
             SET fecha_inicio = $1, fecha_fin = $2, estado = $3 
             WHERE id_periodo = $4 
             RETURNING *`,
            [fecha_inicio, fecha_fin, estado, id]
        );

        return result.rows[0];
    }

    async eliminarPeriodoContable(id) {
        const result = await db.query(
            "DELETE FROM periodos_contables WHERE id_periodo = $1 RETURNING *",
            [id]
        );
        return result.rows[0];
    }

}

export default new PeriodoContableService();