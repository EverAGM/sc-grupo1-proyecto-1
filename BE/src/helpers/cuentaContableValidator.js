/**
 * Valida y limpia los datos de entrada para crear una cuenta contable.
 * Aplica validaciones de obligatoriedad, longitud y formato.
 * * @param {object} datos - Los datos recibidos del cuerpo de la solicitud (req.body).
 * @returns {object} Un objeto con los datos limpios y parseados.
 * @throws {Error} Un error con un prefijo claro si alguna validación falla.
 */
export function cuentaContableValidator(datos) {
    const { nombre, tipo, categoria, parent_id } = datos;

    const nombre_L = (nombre || '').trim();
    const tipo_L = (tipo || '').trim().toUpperCase();
    const categoria_L = (categoria || '').trim().toUpperCase();
    
    if (!nombre_L || !tipo_L || !categoria_L) {
        throw new Error('DatosFaltantes: Los campos nombre, tipo y categoría son obligatorios.');
    }

    const MAX_LENGTH = { nombre: 100, tipo: 20, categoria: 50 };
    
    if (nombre_L.length > MAX_LENGTH.nombre) {
        throw new Error(`LongitudExcedida: El nombre excede el máximo de ${MAX_LENGTH.nombre} caracteres.`);
    }
    if (tipo_L.length > MAX_LENGTH.tipo) {
        throw new Error(`LongitudExcedida: El tipo excede el máximo de ${MAX_LENGTH.tipo} caracteres.`);
    }
    if (categoria_L.length > MAX_LENGTH.categoria) {
        throw new Error(`LongitudExcedida: La categoría excede el máximo de ${MAX_LENGTH.categoria} caracteres.`);
    }

    let parent_id_num = null;

    if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
        const temp_id_num = parseInt(parent_id);

        if (isNaN(temp_id_num) || temp_id_num <= 0) {
            throw new Error('ParentIdInvalido: El ID de la cuenta padre debe ser un número entero positivo válido.');
        }
        parent_id_num = temp_id_num;
    }
    
    return {
        nombre_L,
        tipo_L,
        categoria_L,
        parent_id_num,
    };
}