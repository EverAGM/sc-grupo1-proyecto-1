import ImportacionCSVService from '../services/ImportacionCSVService.js';
import multer from 'multer';


const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const esCSV = file.mimetype === 'text/csv' || 
                     file.mimetype === 'application/csv' ||
                     file.mimetype === 'text/plain' ||
                     file.originalname.toLowerCase().endsWith('.csv');
        
        if (esCSV) {
            cb(null, true);
        } else {
            cb(new Error('Solo archivo .csv'), false);
        }
    }
});

class ImportacionCSVController {
    constructor() {
        this.uploadMiddleware = upload.single('archivo');
    }
    async importarCSV(req, res) {
        const startTime = Date.now();
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No se proporcionó ningún archivo CSV',
                    codigo: 'ARCHIVO_FALTANTE',
                    ayuda: {
                        metodo: 'POST',
                        url: '/api/importacion-csv/importar',
                        contentType: 'multipart/form-data',
                        campo: 'archivo',
                        extension: '.csv'
                    }
                });
            }
            if (!req.file.buffer || req.file.buffer.length === 0) {
                console.log(' Archivo vacío');
                return res.status(400).json({
                    success: false,
                    error: 'El archivo CSV está vacío',
                    codigo: 'ARCHIVO_VACIO'
                });
            }

            const resultado = await ImportacionCSVService.convertirCSVaJSON(req.file.buffer);
            const tiempoProcesamiento = Date.now() - startTime;
            const respuesta = {
                success: true,
                message: `CSV importado correctamente: ${resultado.transacciones.length} transacciones procesadas`,
                datos: {
                    archivo: req.file.originalname,
                    transaccionesImportadas: resultado.transacciones.length,
                    erroresEncontrados: resultado.errores.length,
                    tiempoProcesamiento: `${tiempoProcesamiento}ms`,
                    resumen: resultado.resumen,
                    transacciones: resultado.transacciones
                }
            };
            
            if (resultado.errores.length > 0) {
                respuesta.advertencias = {
                    mensaje: `Se encontraron ${resultado.errores.length} errores en el archivo`,
                    errores: resultado.errores
                };
            }

            res.status(200).json(respuesta);

        } catch (error) {
            const tiempoProcesamiento = Date.now() - startTime;

            res.status(500).json({
                success: false,
                error: 'Error procesando el archivo CSV',
                detalles: error.message,
                codigo: 'ERROR_PROCESAMIENTO',
                archivo: req.file?.originalname || 'desconocido'
            });
        }
    }

    async obtenerTransacciones(req, res) {
        try {
            const resultado = ImportacionCSVService.obtenerDatosImportados();
            if (resultado.cantidad === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No hay transacciones importadas',
                    datos: []
                });
            }
            res.json({
                success: true,
                message: `${resultado.cantidad} transacciones encontradas`,
                datos: resultado
            });
            
        } catch (error) {
            console.error('error: ', error);
            
            res.status(500).json({
                success: false,
                error: 'Error al obtener las transacciones',
                detalles: error.message
            });
        }
    }

    manejarErrorMulter(error, req, res, next) {
        console.error('error: ', error);
        if (error instanceof multer.MulterError) {
            console.error('error: ', error.message);
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error: 'El archivo es demasiado grande (máximo 5MB)',
                    codigo: 'ARCHIVO_MUY_GRANDE'
                });
            }
            
            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    error: 'Campo de archivo incorrecto. Use el campo "archivo"',
                    codigo: 'CAMPO_INCORRECTO',
                    detalles: 'Asegúrese de usar "archivo" como nombre del campo en form-data'
                });
            }
            
            return res.status(400).json({
                success: false,
                error: 'Error procesando el archivo',
                detalles: error.message,
                codigo: error.code
            });
        }
        
        if (error && error.message.includes('Solo se permiten archivos CSV')) {
            return res.status(400).json({
                success: false,
                error: 'Formato de archivo no válido',
                detalles: 'Solo se aceptan archivos .csv',
                codigo: 'FORMATO_INVALIDO'
            });
        }
        next(error);
    }
}

export default new ImportacionCSVController();

