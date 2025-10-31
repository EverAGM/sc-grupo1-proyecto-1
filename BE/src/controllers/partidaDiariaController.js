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
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }  
}