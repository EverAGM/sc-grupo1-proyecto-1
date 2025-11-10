import partidaDiariaService from "../services/partidaDiariaService.js";

export const crearPartidaDiaria = async (req, res) => {
    try {
        const { concepto, estado, id_periodo } = req.body;

        if (!concepto || !id_periodo) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos obligatorios'
            });
        }

        // 
        if (typeof concepto.trim() !== 'string' || concepto.trim().length === 0 || concepto.trim().length > 255) {
            return res.status(400).json({
                success: false,
                message: 'El concepto debe ser una cadena no vacía de máximo 255 caracteres.'
            });
        }

        //
        const id_periodo_num = parseInt(id_periodo);
        if(isNaN(id_periodo_num) || id_periodo_num <=0 ){
            return res.status(400).json({
                success: false,
                message: "El id_periodo debe ser un número entero positivo válido."
            });

        }

        const nuevaPartida = await partidaDiariaService.crearPartidaDiaria({
            concepto,
            estado,
            id_periodo
        });

        res.status(201).json({
            success: true,
            message: 'Partida diaria creada exitosamente',
            data: nuevaPartida
        });
    } catch (error) {
        if (error.message === "PeriodoContableNotFound") {
            return res.status(404).json({ // Se usa 404 porque el recurso referenciado no existe
                success: false,
                message: "El período contable especificado no existe."
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
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

        const partida = await partidaDiariaService.obtenerPartidaPorId(id);

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
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
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
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};