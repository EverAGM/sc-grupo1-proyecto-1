import { patronFecha, parseFecha } from "./fechaValidator.js";

/**
 * Valida y limpia los datos de una partida diaria.
 * @param {object} datos - Los datos recibidos del cuerpo de la solicitud (req.body).
 * @returns {object} Un objeto con los datos limpios y parseados.
 * @throws {Error} Un error con un prefijo claro si alguna validación falla.
 */
export function partidaDiariaValidator(datos) {
    const { concepto, estado, id_periodo } = datos;

    if (!concepto || !id_periodo) {
        throw new Error('DatosFaltantes: Faltan datos obligatorios (concepto, id_periodo).');
    }

    const concepto_L = String(concepto || '').trim();
    const MAX_CONCEPTO_LENGTH = 255;

    if (concepto_L.length === 0 || concepto_L.length > MAX_CONCEPTO_LENGTH) {
        throw new Error(`ConceptoInvalido: El concepto debe ser una cadena no vacía de máximo ${MAX_CONCEPTO_LENGTH} caracteres.`);
    }

    const id_periodo_num = parseInt(id_periodo);
    
    if (isNaN(id_periodo_num) || id_periodo_num <= 0) {
        throw new Error("IdPeriodoInvalido: El id_periodo debe ser un número entero positivo válido.");
    }

    const estado_L = estado ? String(estado).trim() : null;

    return {
        concepto_L,
        estado_L,
        id_periodo_num,
    };
}

/**
 * Valida y formatea las fechas de inicio y fin para buscar partidas.
 * @param {object} query - Los parámetros de consulta (req.query).
 * @returns {object} Un objeto con las fechas limpias y formateadas en ISO.
 * @throws {Error} Un error con un prefijo claro si alguna validación falla.
 */
export function partidaDiariaValidatorFecha(query) {
    const { fecha_inicio, fecha_fin } = query;

    if (!fecha_inicio || !fecha_fin) {
        throw new Error('DatosFaltantes: Faltan parámetros de fecha obligatorios (fecha_inicio, fecha_fin).');
    }

    if (!patronFecha.test(fecha_inicio) || !patronFecha.test(fecha_fin)) {
        throw new Error('FormatoFechaInvalido: El formato de fecha debe ser DD/MM/AAAA.');
    }

    const inicio = parseFecha(fecha_inicio);
    const fin = parseFecha(fecha_fin);

    if (isNaN(inicio) || isNaN(fin)) {
         throw new Error('FechaNoReal: Una o ambas fechas no son fechas reales.');
    }

    if (inicio.getTime() > fin.getTime()) {
        throw new Error('RangoDeFechasInvalido: La fecha de fin debe ser igual o posterior a la fecha de inicio.');
    }

    const fechaInicioISO = inicio.toISOString().split('T')[0];
    const fechaFinISO = fin.toISOString().split('T')[0];

    return {
        fechaInicioISO,
        fechaFinISO,
    };
}