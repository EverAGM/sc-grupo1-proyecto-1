import db from "../database/db.js";

class CuentaContableService {
  async crearCuentaContable(datos) {
    const { nombre, tipo, categoria, parent_id } = datos;

    // Validar que las cuentas raíz tengan tipo válido
    if (!parent_id && !tipo) {
      throw new Error("Las cuentas raíz deben tener un tipo");
    }
//VALIDACION CRITICA IMPLEMENTADA
    const cuentaExistente = await db.query(
      "SELECT 1 FROM cuentas_contables WHERE nombre = $1",
      [nombre]
    );
    if (cuentaExistente.rows.length > 0) {
      throw new Error(`Ya existe una cuenta contable con el nombre: "${nombre}"`);
    }
//VLIDACOIN CRITICA IMPLEMENTADA

    // Generar código automático (ahora requiere el tipo para cuentas raíz)
    const codigo = await this.generarCodigoAutomatico(parent_id, tipo);

    // Insertar en la base de datos
    const result = await db.query(
      `INSERT INTO cuentas_contables 
         (codigo, nombre, tipo, categoria, padre_id) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
      [codigo, nombre, tipo, categoria, parent_id]
    );

    return result.rows[0];
  }

  async generarCodigoAutomatico(padreId = null, tipo = null) {
    if (!padreId) {
      // 🔹 CÓDIGO PARA CUENTA RAÍZ - Basado en el TIPO
      const codigosTipo = {
        ACTIVO: "1",
        PASIVO: "2",
        PATRIMONIO: "3",
        INGRESO: "4",
        GASTO: "5",
      };

      if (!tipo || !codigosTipo[tipo]) {
        throw new Error(
          `Tipo inválido para cuenta raíz. Usar: ${Object.keys(
            codigosTipo
          ).join(", ")}`
        );
      }

      return codigosTipo[tipo];
    } else {
      // 🔹 CÓDIGO PARA CUENTA HIJA
      // Verificar que el padre existe
      const padreResult = await db.query(
        "SELECT codigo FROM cuentas_contables WHERE id_cuenta = $1",
        [padreId]
      );

      if (padreResult.rows.length === 0) {
        throw new Error("Cuenta padre no encontrada");
      }

      const codigoPadre = padreResult.rows[0].codigo;

      // Buscar último hijo
      const hijosResult = await db.query(
        `
            SELECT codigo FROM cuentas_contables 
            WHERE padre_id = $1 
            ORDER BY codigo DESC 
            LIMIT 1
        `,
        [padreId]
      );

      if (hijosResult.rows.length === 0) {
        return `${codigoPadre}01`; // Primer hijo
      }

      const ultimoHijo = hijosResult.rows[0].codigo;
      const secuencia = ultimoHijo.substring(codigoPadre.length);
      const nuevaSecuencia = (parseInt(secuencia) + 1)
        .toString()
        .padStart(2, "0");

      return `${codigoPadre}${nuevaSecuencia}`;
    }
  }

  async obtenerCuentaPorId(id) {
    const result = await db.query(
      `SELECT * FROM cuentas_contables WHERE id_cuenta = $1`,
      [id]
    );

    return result.rows[0];
  }

  async obtenerTodasCuentas() {
    const result = await db.query(`SELECT * FROM cuentas_contables ORDER BY codigo`);
    return result.rows;
  }

  async eliminarCuentaContable(id) {
    const result = await db.query(
      `DELETE FROM cuentas_contables WHERE id_cuenta = $1 RETURNING *`,
      [id]
    );

    return result.rows[0];
  }

  async actualizarCuentaContable(id, datos) {
    const { nombre, tipo, categoria, parent_id } = datos;

    const result = await db.query(
      `UPDATE cuentas_contables 
         SET nombre = $1, tipo = $2, categoria = $3, padre_id = $4 
         WHERE id_cuenta = $5 
         RETURNING *`,
      [nombre, tipo, categoria, parent_id, id]
    );
    
    return result.rows[0];
  }
}

export default new CuentaContableService();
