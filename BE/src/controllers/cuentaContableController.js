import cuentaContableService from "../services/cuentaContableService.js";

export const crearCuentaContable = async (req, res) => {

    try{
            const {nombre, tipo, categoria, parent_id} = req.body;
        if (!nombre || !tipo || !categoria) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos obligatorios'
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
        const cuenta = await cuentaContableService.obtenerCuentaPorId(id);

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