import periodoContableService from "../services/periodoContableService.js";
import {periodoValidator} from "../helpers/periodoValidator.js"

export const crearPeriodoContable = async (req, res) => {
    try {
        const data = periodoValidator(req.body);

        const nuevoPeriodo = await periodoContableService.crearPeriodoContable({
            fecha_inicio: data.fechaInicioISO, 
            fecha_fin: data.fechaFinISO, 
            estado: data.estado_L   
        });


        res.status(201).json({
            success: true,
            message: 'Periodo contable creado exitosamente',
            data: nuevoPeriodo
        });
    } catch (error) {

        console.error("Error al crear periodo contable:", error); 
        return getThrow(error, res);
    }
};

export const obtenerPeriodoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const id_N = parseInt(id);
        if(isNaN(id_N) || id_N <=0){
            throw new Error('IdInvalido: El ID del periodo debe ser un número entero positivo válido.');
        }

        const periodo = await periodoContableService.obtenerPeriodoPorId(id_N);

        if (!periodo) {
            throw new Error('PeriodoContableNotFound: Periodo contable no encontrado');
        }   

        res.status(200).json({
            success: true,
            data: periodo
        });
    } catch (error) {
        return getThrow(error, res);
    }
}; 

export const verPeriodosContables = async (req, res) => {
    try {
        const periodos = await periodoContableService.obtenerTodosPeriodos();
        res.status(200).json({
            success: true,
            data: periodos
        });
    } catch (error) {
        return getThrow(error, res);
    }
};

export const eliminarPeriodoContable = async (req, res) => {
    try {
        const { id } = req.params;
        const id_N = parseInt(id);
        if(isNaN(id_N) || id_N <=0){
            throw new Error('IdInvalido: El ID del periodo debe ser un número entero positivo válido.');
        }

        const periodoEliminado = await periodoContableService.eliminarPeriodoContable(id_N);

        if (!periodoEliminado) {
            throw new Error('PeriodoContableNotFound: Periodo contable no encontrado');
        }

        res.status(200).json({
            success: true,
            message: 'Periodo contable eliminado exitosamente',
        });
    } catch (error) {
        return getThrow(error, res);
    }
};

export const actualizarPeriodoContable = async (req, res) => {
    try {
        const { id } = req.params;
        const id_N = parseInt(id);
        if(isNaN(id_N) || id_N <=0){
            throw new Error('IdInvalido: El ID del periodo debe ser un número entero positivo válido.');
        }

        const data = periodoValidator(req.body);

        const periodoActualizado = await periodoContableService.actualizarPeriodoContable(id_N, {
            fecha_inicio : data.fechaInicioISO,
            fecha_fin : data.fechaFinISO,
            estado : data.estado_L
        });

        if (!periodoActualizado) {
            throw new Error('PeriodoContableNotFound: Periodo contable no encontrado');
        }

        res.status(200).json({
            success: true,
            message: 'Periodo contable actualizado exitosamente',
            data: periodoActualizado
        });
    } catch (error) {
        console.error("Error al intentar actualizar periodo contable",error);
        return getThrow(error, res)
    }
};


function getThrow(error, res){
    const specificErrors = {
        'DatosFaltantes': 400,
        'FormatoFechaInvalido': 400,
        'FechaNoReal': 400,
        'RangoDeFechasInvalido': 400,
        //'PeriodoContableNotFound': 400,
        'IdInvalido':400,
        'PeriodoExistente': 409,
        'PeriodoContableNotFound': 404,
        'EstadoInvalido': 400, 
        '22008': 400,
        '23505': 409,
        '23503': 409,
        '23001': 409,
    };
    const errorKey = error.code || error.message.split(':')[0].trim();
    const statusCode = specificErrors[errorKey] || 500;
    let message = error.message;

    if (statusCode === 500) {
        message = "Error interno del servidor";
    }
    else if (errorKey === '23503' || errorKey === '23001') {
        message = 'No se puede completar la operación porque el registro está asociado a otros datos (restricción de clave foránea).';
    }
    else if (errorKey === '23505') {
        message = 'Ya existe un registro con esos datos.';
    }
    else if (errorKey in specificErrors && !error.code) { 
        message = error.message.split(':').slice(1).join(':').trim() || error.message;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: message,
    });
}