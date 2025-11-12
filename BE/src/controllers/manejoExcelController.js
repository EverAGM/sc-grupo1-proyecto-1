import ImportacionXLSXService from '../services/manejoExcelService.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, 
        files: 1
    },
    fileFilter: (req, file, cb) => {
       
        const esXLSX = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                       file.mimetype === 'application/vnd.ms-excel' ||
                       file.originalname.toLowerCase().endsWith('.xlsx') ||
                       file.originalname.toLowerCase().endsWith('.xls');
        
        if (esXLSX) {
            cb(null, true);
        } else {
            cb(new Error('Solo archivos Excel (.xlsx, .xls)'), false);
        }
    }
});

class ImportacionXLSXController {
    constructor() {
        this.uploadMiddleware = upload.single('archivo');
    }
    async importarXLSX(req, res) {
        const startTime = Date.now();
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No se ha dado ningún archivo Excel',
                    codigo: 'ARCHIVO_FALTANTE'
                });
            }

            if (!req.file.buffer || req.file.buffer.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El archivo Excel está vacío',
                    codigo: 'ARCHIVO_VACIO'
                });
            }

            const resultado = await ImportacionXLSXService.convertirXLSXaJSON(req.file.buffer);
            const tiempoProcesamiento = Date.now() - startTime;
            const respuesta = {
                success: true,
                message: `Excel importado correctamente: ${resultado.transacciones.length} `,
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
                    mensaje: `Error:  ${resultado.errores.length}`,
                    errores: resultado.errores
                };
            }

            res.status(200).json(respuesta);

        } catch (error) {
            const tiempoProcesamiento = Date.now() - startTime;
    
            res.status(500).json({
                success: false,
                error: 'Error procesando el archivo Excel',
                detalles: error.message,
                codigo: 'ERROR_PROCESAMIENTO',
                archivo: req.file?.originalname || 'desconocido'
            });
        }
    }

    async obtenerTransacciones(req, res) {
        try {
            const resultado = ImportacionXLSXService.obtenerDatosImportados();
            
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
            
            res.status(500).json({
                success: false,
                error: 'Error al obtener las transacciones',
                detalles: error.message
            });
        }
    }

    async exportarXLSX(req, res) {
        try {
            const resultado = ImportacionXLSXService.exportarAXLSX();
            
            res.setHeader('Content-Type', resultado.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${resultado.filename}"`);
            res.setHeader('Content-Length', resultado.buffer.length);
            res.send(resultado.buffer);
            
        } catch (error) {
                 
            res.status(500).json({
                success: false,
                error: 'Error al exportar las transacciones a Excel',
                detalles: error.message,
                codigo: 'ERROR_EXPORTACION'
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
        
        if (error && error.message.includes('Solo archivos Excel')) {
            return res.status(400).json({
                success: false,
                error: 'Formato de archivo no válido',
                detalles: 'Solo se aceptan archivos Excel (.xlsx, .xls)',
                codigo: 'FORMATO_INVALIDO'
            });
        }
        next(error);
    }
}

export default new ImportacionXLSXController();

