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
      `SELECT 
            pd.*,                  
            pc.fecha_fin 
        FROM 
            partida_diaria pd
        JOIN 
            periodos_contables pc 
            ON pd.id_periodo = pc.id_periodo 
        WHERE 
            pd.id_partida_diaria = $1`,
      ///`SELECT * FROM partida_diaria WHERE id_partida_diaria = $1`,
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

  async obtenerPartidaPorPeriodo(id_periodo) {
    const result = await db.query(
        `SELECT
            pd.id_partida_diaria,
            pd.fecha_creacion,
            pd.concepto,
            pd.estado,
            pd.id_periodo,
            COALESCE(
                json_agg(
                  json_build_object(
                      'id_transaccion', tc.id_transaccion,
                      'fecha_creacion', tc.fecha_creacion,
                      'cuenta_id', tc.cuenta_id,
                      'codigo_cuenta', cc.codigo,
                      'nombre_cuenta', cc.nombre,
                      'monto', tc.monto,
                      'tipo_transaccion', tc.tipo_transaccion
                  )
                ) FILTER (WHERE tc.id_transaccion IS NOT NULL),
                '[]'::json
            ) AS transacciones
        FROM
            partida_diaria pd
        LEFT JOIN
            transacciones_contables tc 
            ON pd.id_partida_diaria = tc.partida_diaria_id
        LEFT JOIN
            cuentas_contables cc
            ON cc.id_cuenta = tc.cuenta_id
        WHERE 
            pd.id_periodo = $1
        GROUP BY
            pd.id_partida_diaria, pd.fecha_creacion, pd.concepto, pd.estado, pd.id_periodo
        ORDER BY
            pd.fecha_creacion DESC;`,
        [id_periodo] 
    );
    return result.rows;
  }

  async obtenerPartidasPorFechas(fecha_inicio, fecha_fin) {
    const result = await db.query(
      `SELECT
            pd.id_partida_diaria,
            pd.fecha_creacion,
            pd.concepto,
            pd.estado,
            pd.id_periodo,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id_transaccion', tc.id_transaccion,
                        'fecha_creacion', tc.fecha_creacion,
                        'cuenta_id', tc.cuenta_id,
                        'codigo_cuenta', cc.codigo,
                        'nombre_cuenta', cc.nombre,
                        'monto', tc.monto,
                        'tipo_transaccion', tc.tipo_transaccion
                    )
                ) FILTER (WHERE tc.id_transaccion IS NOT NULL),
                '[]'::json
            ) AS transacciones
        FROM
            partida_diaria pd
        LEFT JOIN
            transacciones_contables tc 
            ON pd.id_partida_diaria = tc.partida_diaria_id
        LEFT JOIN
            cuentas_contables cc
            ON cc.id_cuenta = tc.cuenta_id
        WHERE 
          pd.fecha_creacion::date >= $1::date
          AND pd.fecha_creacion::date <= $2::date
        GROUP BY
            pd.id_partida_diaria, pd.fecha_creacion, pd.concepto, pd.estado, pd.id_periodo
        ORDER BY
            pd.fecha_creacion DESC;`,
      [fecha_inicio, fecha_fin]
    );
    return result.rows;
  }

  async eliminarPartidaDiaria(id) {
    const result = await db.query(
      `DELETE FROM partida_diaria WHERE id_partida_diaria = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async actualizarPartidaDiaria(id, datos) {
    const { concepto, estado, id_periodo } = datos;

    const result = await db.query(
      `UPDATE partida_diaria 
         SET concepto = $1, estado = $2, id_periodo = $3 
         WHERE id_partida_diaria = $4 
         RETURNING *`,
      [concepto, estado, id_periodo, id]
    );
    return result.rows[0];   
  }
}

export default new PartidaDiariaService();