import periodoContableService from "../services/periodoContableService.js";

export const crearPeriodoContable = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, estado } = req.body;
        const estado_L = String(estado || '').trim().toUpperCase();
        const patronFecha = /^\d{2}\/\d{2}\/\d{4}$/;

        if (!fecha_inicio || !fecha_fin || !estado_L) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos obligatorios (fecha de inicio, fecha de fin, estado)'
            });
        }
        //
        if (!patronFecha.test(fecha_inicio) || !patronFecha.test(fecha_fin)) {
            return res.status(400).json({
                success: false,
                message: 'El formato de fecha es inválido. Debe usar el formato DD/MM/AAAA.'
            });
        }
        const parseFecha = (fechaStr) => {
            const [dia, mes, anio] = fechaStr.split('/');
            return new Date(anio, mes - 1, dia);//enero usa 0
        };
        const inicio = parseFecha(fecha_inicio);
        const fin = parseFecha(fecha_fin);
        if (isNaN(inicio) || isNaN(fin) || inicio.getFullYear() !== parseInt(fecha_inicio.substring(6))) {
             return res.status(400).json({
                success: false,
                message: 'Una o ambas fechas no son fechas reales (ej. 31/02 o año inválido).'
            });
        }
        if (inicio.getTime() > fin.getTime()) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio.'
            });
        }//
        const fechaInicioISO = inicio.toISOString().split('T')[0];
        const fechaFinISO = fin.toISOString().split('T')[0];


        const nuevoPeriodo = await periodoContableService.crearPeriodoContable({
            fecha_inicio: fechaInicioISO, 
            fecha_fin: fechaFinISO, 
            estado: estado_L   //se guardan los datos filtrados y parseados en formato aceptable
        });


        res.status(201).json({
            success: true,
            message: 'Periodo contable creado exitosamente',
            data: nuevoPeriodo
        });
    } catch (error) {

        console.error("Error al crear periodo contable:", error); 
        
        if (error.code === '22008') { // Coigo de PostgreSQL por un dato fuera de rango
            return res.status(400).json({
                success: false,
                message: 'Error de formato de fecha al intentar guardar en la base de datos.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const obtenerPeriodoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const id_N = parseInt(id);
        if(isNaN(id_N) || id_N <=0){
            return res.status(400).json({
                success: false,
                message: 'El ID del periodo debe ser un número entero positivo válido.'
            });
        }

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