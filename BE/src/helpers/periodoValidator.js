import {patronFecha, parseFecha} from "./fechaValidator.js";

/**
 * Valida y formatea los datos de un período contable (fechas y estado).
 * @param {object} datos - Los datos recibidos del cuerpo de la solicitud (req.body).
 * @returns {object} Un objeto con los datos limpios y formateados (fechas ISO, estado en mayúsculas).
 * @throws {Error} Un error con un prefijo claro si alguna validación falla.
 */
export function periodoValidator(datos) {
    const { fecha_inicio, fecha_fin, estado } = datos;

    const estado_N = parseInt(estado);
    if(!isNaN(estado_N)){
        throw new Error('EstadoInvalido: El estado debe ser ACTIVO, PRÓXIMO O FINALIZADO');
    }

    const estado_L = String(estado || '').trim().toUpperCase();

    if (estado_L !== 'ACTIVO' && estado_L !== 'PRÓXIMO' && estado_L !== 'FINALIZADO') {
        throw new Error('EstadoInvalido: El estado solo puede ser ACTIVO, PRÓXIMO, o FINALIZADO.');
    }

    if (!fecha_inicio || !fecha_fin || !estado_L) {
        throw new Error('DatosFaltantes: Faltan datos obligatorios (fecha de inicio, fecha de fin, estado).');
    }
    
    if (!patronFecha.test(fecha_inicio) || !patronFecha.test(fecha_fin)) {
        throw new Error('FormatoFechaInvalido: El formato de fecha es inválido. Debe usar el formato DD/MM/AAAA.');
    }

    const inicio = parseFecha(fecha_inicio);
    const fin = parseFecha(fecha_fin);
    if (isNaN(inicio) || isNaN(fin) || inicio.getFullYear() !== parseInt(fecha_inicio.substring(6))) {
         throw new Error('FechaNoReal: Una o ambas fechas no son fechas reales (ej. 31/02 o año inválido).');
    }

    if (inicio.getTime() > fin.getTime()) {
        throw new Error('RangoDeFechasInvalido: La fecha de fin debe ser igual o posterior a la fecha de inicio.');
    }

    const fechaInicioISO = inicio.toISOString().split('T')[0];
    const fechaFinISO = fin.toISOString().split('T')[0];

    return {
        fechaInicioISO, 
        fechaFinISO, 
        estado_L
    };
}