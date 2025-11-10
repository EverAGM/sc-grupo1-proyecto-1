import cuentaContableService from "../services/cuentaContableService.js";

export const crearCuentaContable = async (req, res) => {

    try{
        const {nombre, tipo, categoria, parent_id} = req.body;
        const parent_id_num = parent_id ? parseInt(parent_id) : null;
        const nombre_L = (nombre || '').trim();
        const tipo_L = (tipo || '').trim().toUpperCase();
        const categoria_L = (categoria || '').trim().toUpperCase();

        if (!nombre_L || !tipo_L || !categoria_L) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre, tipo y categoría son obligatorios.'
            });
        }

        if (nombre_L.length > 100 || tipo_L.length > 20 || categoria_L.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Longitud de campos excedida. Verifique nombre (max 100), tipo (max 20) y categoría (max 50).'
            });
        }

        //no es obligatorio, cuando se ingresa un valor se valida
        if (parent_id !== undefined && parent_id !== null && parent_id !== '' && (isNaN(parent_id_num) || parent_id_num <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'El ID de la cuenta padre debe ser un número entero positivo válido.'
            });
        }

            const nuevaCuenta = await cuentaContableService.crearCuentaContable({
                nombre, tipo, categoria, parent_id
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

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const obtenerCuentaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const idNum = parseInt(id);
        if (isNaN(idNum) || idNum <= 0) {
             return res.status(400).json({
                success: false,
                message: 'El ID proporcionado debe ser un número entero positivo válido.'
            });
        }

        const cuenta = await cuentaContableService.obtenerCuentaPorId(idNum);
        if (!cuenta) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta contable no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: cuenta
        });
    } catch (error) {
        console.error('Error al obtener cuenta contable:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
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
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};