import cuentaContableService from "../services/cuentaContableService.js";
import { cuentaContableValidator } from "../helpers/cuentaContableValidator.js";

export const crearCuentaContable = async (req, res) => {

    try{
        const {nombre, tipo, categoria, parent_id} = req.body;
        const data = cuentaContableValidator(req.body);

            const nuevaCuenta = await cuentaContableService.crearCuentaContable({
                nombre : data.nombre_L, 
                tipo : data.tipo_L,
                categoria : data.categoria_L,
                parent_id : data.parent_id_num
            });

        res.status(201).json({
            success: true,
            message: 'Cuenta contable creada exitosamente',
            data: nuevaCuenta
        });
    } catch (error) {

        if (error.message.includes('Ya existe una cuenta contable con el nombre')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('Tipo inválido para cuenta raíz') || error.message.includes('Cuenta padre no encontrada')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        console.error('Error al crear cuenta contable:', error);

        return getThrow(error, res);
    }
};

export const obtenerCuentaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const idNum = parseInt(id);
        if (isNaN(idNum) || idNum <= 0) {
             throw new Error('IdInvalido: El ID proporcionado debe ser un número entero positivo válido');
        }

        const cuenta = await cuentaContableService.obtenerCuentaPorId(idNum);
        if (!cuenta) {
            throw new Error('CuentaNotFound: Cuenta contable no encontrada');
        }

        res.status(200).json({
            success: true,
            data: cuenta
        });
    } catch (error) {
        console.error('Error al obtener cuenta contable:', error);
        return getThrow(error, res);
    }
};

export const verCuentasContables = async (req, res) => {
    try {
        const cuentas = await cuentaContableService.obtenerTodasCuentas();
        res.status(200).json({
            success: true,
            data: cuentas
        });
    } catch (error) {
        console.error('Error al obtener cuentas contables:', error);
        return getThrow(error, res);
    }
};

export const eliminarCuentaContable = async (req, res) => {
    try {
        const { id } = req.params;

        const idNum = parseInt(id);
        if (isNaN(idNum) || idNum <= 0) {
            throw new Error('IdInvalido: El ID proporcionado debe ser un número entero positivo válido.');
        }

        const resultado = await cuentaContableService.eliminarCuentaContable(idNum);
        if (!resultado) {
            throw new Error('CuentaNotFound: Cuenta contable no encontrada o no se puede eliminar debido a restricciones.');
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta contable eliminada exitosamente'
        });
    } catch (error) {
        return getThrow(error, res);
    }
}

export const actualizarCuentaContable = async (req, res) => {
    try {
        const { id } = req.params;
        const datos = req.body;

        const idNum = parseInt(id);
        if (isNaN(idNum) || idNum <= 0) {
            throw new Error('IdInvalido: El ID proporcionado debe ser un número entero positivo válido.');
            
        }

        const cuentaActualizada = await cuentaContableService.actualizarCuentaContable(idNum, datos);
        if (!cuentaActualizada) {
            throw new Error('CuentaNotFound: Cuenta contable no encontrada');
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta contable actualizada exitosamente',
            data: cuentaActualizada
        });
    } catch (error) {
        console.error('Error al actualizar cuenta contable:', error);
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
        'LongitudExcedida': 400,
        'ParentIdInvalido': 400,
        'IdInvalido': 400, 
        'TipoInválido': 400,
        'CuentaPadreNoEncontrada': 400, 
        'YaExisteCuenta': 409, 
        'CuentaNotFound': 404, 
        '22008': 400,
        '23505': 409,
        '23503': 409,
        '23001': 409, 
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
    else if (errorKey === '23505') {
        message = 'Ya existe un registro con esos datos. Se violó una restricción de unicidad.';
    }
    else if (errorKey === '23503' || errorKey === '23001') {
        message = 'No se puede eliminar la cuenta. Tiene registros asociados que dependen de ella.';
    }

    return res.status(statusCode).json({
      success: false,
      message: message,
    });
}