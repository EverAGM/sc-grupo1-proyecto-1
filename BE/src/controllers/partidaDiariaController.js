import partidaDiariaService from "../services/partidaDiariaService.js";
import { partidaDiariaValidator, partidaDiariaValidatorFecha } from "../helpers/partidaValidator.js";


export const crearPartidaDiaria = async (req, res) => {
    try {
        
        const data = partidaDiariaValidator(req.body)

        const nuevaPartida = await partidaDiariaService.crearPartidaDiaria({
            concepto : data.concepto_L,
            estado : data.estado_L,
            id_periodo : data.id_periodo_num
        });

        res.status(201).json({
            success: true,
            message: 'Partida diaria creada exitosamente',
            data: nuevaPartida
        });
    } catch (error) {
        return getThrow(error, res);
    }  
}

export const obtenerPartidaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const id_partida = parseInt(id);
        if (isNaN(id_partida) || id_partida <=0){//
            return res.status(400).json({
                success: false,
                message: 'El ID porporcionado no es un número entero positivo válido'
            });
        }

        const partida = await partidaDiariaService.obtenerPartidaPorId(id_partida);

        if (!partida) {
            return res.status(404).json({
                success: false,
                message: 'Partida diaria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: partida
        });
    } catch (error) {
        return getThrow(error, res);
    }
}; 

export const verPartidasDiarias = async (req, res) => {
    try {
        const partidas = await partidaDiariaService.obtenerTodasPartidas();
        res.status(200).json({
            success: true,
            data: partidas
        });
    } catch (error) {
        return getThrow(error, res);
    }
};

export const obtenerPartidasPorPeriodo = async (req, res) => {
    try {
        const { id_periodo } = req.params;

        const id_periodo_num = parseInt(id_periodo);
        if (isNaN(id_periodo_num) || id_periodo_num <=0){//
            return res.status(400).json({
                success: false,
                message: 'El ID de período proporcionado no es un número entero positivo válido'
            });
        }

        const partidas = await partidaDiariaService.obtenerPartidaPorPeriodo(id_periodo_num);

        res.status(200).json({
            success: true,
            data: partidas
        });
    } catch (error) {
        return getThrow(error, res);
    }
};

export const obtenerPartidasPorFechas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        const data = partidaDiariaValidatorFecha(req.query);

        const partidas = await partidaDiariaService.obtenerPartidasPorFechas(fecha_inicio, fecha_fin);
        res.status(200).json({
            success: true,
            data: partidas
        });
    } catch (error) {
        return getThrow(error, res);
    }
};

export const eliminarPartidaDiaria = async (req, res) => {
    try {
        const { id } = req.params;

        const id_partida = parseInt(id);
        if (isNaN(id_partida) || id_partida <=0){//
            return res.status(400).json({
                success: false,
                message: 'El ID porporcionado no es un número entero positivo válido'
            });
        }

        const eliminado = await partidaDiariaService.eliminarPartidaDiaria(id_partida);

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Partida diaria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Partida diaria eliminada exitosamente'
        });
    } catch (error) {

        return getThrow(error, res);
    }
};

export const actualizarPartidaDiaria = async (req, res) => {
    try {
        const { id } = req.params;
        const { concepto, estado, id_periodo } = req.body;

        const id_partida = parseInt(id);
        if (isNaN(id_partida) || id_partida <=0){//
            return res.status(400).json({
                success: false,
                message: 'El ID porporcionado no es un número entero positivo válido'
            });
        }
        const data = partidaDiariaValidator(req.body);

        const datosActualizar = {};
        if (concepto !== undefined) datosActualizar.concepto = data.concepto_L;
        if (estado !== undefined) datosActualizar.estado = data.estado_L;
        if (id_periodo !== undefined) datosActualizar.id_periodo = data.id_periodo_num;

        const actualizado = await partidaDiariaService.actualizarPartidaDiaria(id_partida, datosActualizar);

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Partida diaria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Partida diaria actualizada exitosamente',
            data: actualizado
        });
    } catch (error) {
        return getThrow(error, res);
    }
};

/**
 * Mapea un error lanzado (throw) a la respuesta HTTP correspondiente (statusCode).
 * Centraliza el manejo de errores de validación, negocio y base de datos.
 * @param {Error} error - El objeto Error capturado en el bloque catch.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Una respuesta JSON con el código de estado apropiado.
 */
function getThrow(error, res){
    const specificErrors = {
        'DatosFaltantes': 400,
        'ConceptoInvalido': 400,
        'IdPeriodoInvalido': 400,
        'FormatoFechaInvalido': 400,
        'RangoDeFechasInvalido': 400,
        'PeriodoContableNotFound': 404,
        'PeriodoExistente': 409, 
    };
    const errorKey = error.code || error.message.split(':')[0].trim();
    const statusCode = specificErrors[errorKey] || 500;
    let message = error.message;

    if (statusCode === 500) {
        console.error("Error interno no mapeado:", error);
        message = "Error interno del servidor";
    } 
    else if (errorKey in specificErrors && !error.code) { 
        message = error.message.split(':').slice(1).join(':').trim() || error.message;
    }
    // Mensaje mejorado para errores de conflicto de la base de datos
    else if (errorKey === '23505') {
        message = 'El registro ya existe. Se violó una restricción de unicidad.';
    }
    else if (errorKey === '23503' || errorKey === '23001') {
        message = 'No se puede eliminar la partida diaria porque tiene transacciones contables asociadas.';
    }

    return res.status(statusCode).json({
      success: false,
      message: message,
    });
}