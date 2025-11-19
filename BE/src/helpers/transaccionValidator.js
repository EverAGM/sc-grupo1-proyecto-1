import partidaDiariaService from "../services/partidaDiariaService.js";
import {patronFecha, parseFecha} from "../helpers/fechaValidator.js";

/**
 * Valida todos los campos de una transacción (fecha, partida, tipo, cuenta, monto) 
 * y verifica que la fecha esté dentro del período de la partida.
 * @param {object} datos - Los datos recibidos del cuerpo de la solicitud (req.body).
 * @returns {object} Un objeto con los datos limpios y parseados (numéricos, fechas, etc.).
 * @throws {Error} Un error si alguna validación falla.
 */
export async function transaccionValidator(datos) {
    const { cuenta_id, monto, tipo_transaccion, partida_diaria_id, fecha_operacion } = datos;

    if (!cuenta_id || !monto || !tipo_transaccion || !partida_diaria_id || !fecha_operacion) {
        throw new Error('DatosFaltantes: Faltan datos obligatorios.');
    }

    if (!patronFecha.test(fecha_operacion)) {
        throw new Error('FormatoFechaInvalido: El formato de fecha debe ser DD/MM/AAAA.');
    }
    const fecha_formato = parseFecha(fecha_operacion);
    const fechaISO = fecha_formato.toISOString().split('T')[0]; 

    if (isNaN(fecha_formato) || fecha_formato.getFullYear() !== parseInt(fecha_operacion.substring(6))) {
         throw new Error('FechaNoReal: Una o ambas fechas no son fechas reales (ej. 31/02 o año inválido).');
    }

    const partida_num = parseInt(partida_diaria_id);
    if (isNaN(partida_num) || partida_num <= 0) {
        throw new Error("PartidaIdInvalido: El id de la partida diaria debe ser un número entero positivo válido.");
    }
    
    const partidaResult = await partidaDiariaService.obtenerPartidaPorId(partida_num);
    if (!partidaResult) {
        throw new Error("PartidaDiariaNotFound");
    }

    const fecha_final = new Date(partidaResult.fecha_fin);
    if (fecha_formato > fecha_final) {
        throw new Error("FechaFueraDePeriodo: La fecha de operación es posterior a la fecha límite del periodo contable.");
    }
    
    if (tipo_transaccion !== "DEBE" && tipo_transaccion !== "HABER") {
        throw new Error("TipoTransaccionInvalido: Debe ser 'DEBE' o 'HABER'.");
    }

    const cuenta_id_num = parseInt(cuenta_id);
    if (isNaN(cuenta_id_num) || cuenta_id_num <= 0) {
        throw new Error("CuentaIdInvalido: El id de la cuenta debe ser un entero positivo.");
    }

    const monto_float = parseFloat(monto);
    if (isNaN(monto_float) || monto_float <= 0) {
        throw new Error("MontoInvalido: El monto debe ser un número positivo.");
    }
    const monto_num = parseFloat(monto_float.toFixed(2));
    if (monto_num <= 0) {
        throw new Error("MontoInvalido: El monto es demasiado pequeño o inválido después del redondeo.");
    }

    return {
        cuenta_id_num,
        monto_num,
        tipo_transaccion,
        partida_num,
        fechaISO, 
    };
}