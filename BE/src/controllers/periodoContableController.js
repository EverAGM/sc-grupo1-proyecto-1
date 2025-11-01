import periodoContableService from "../services/periodoContableService.js";

export const crearPeriodoContable = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, estado } = req.body;

        if (!fecha_inicio || !fecha_fin || !estado) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos obligatorios'
            });
        }

        const nuevoPeriodo = await periodoContableService.crearPeriodoContable({
            fecha_inicio, fecha_fin, estado
        });

        res.status(201).json({
            success: true,
            message: 'Periodo contable creado exitosamente',
            data: nuevoPeriodo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const obtenerPeriodoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const periodo = await periodoContableService.obtenerPeriodoPorId(id);

        if (!periodo) {
            return res.status(404).json({
                success: false,
                message: 'Periodo contable no encontrado'
            });
        }   

        res.status(200).json({
            success: true,
            data: periodo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
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
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};