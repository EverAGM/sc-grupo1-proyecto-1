import express from 'express';
import importacionXLSXController from '../controllers/manejoExcelController.js';

const router = express.Router();

router.post('/importar', 
    importacionXLSXController.uploadMiddleware,
    importacionXLSXController.manejarErrorMulter,
    async (req, res) => {
        await importacionXLSXController.importarXLSX(req, res);
    }
);

router.get('/transacciones', async (req, res) => {
    await importacionXLSXController.obtenerTransacciones(req, res);
});


router.get('/exportar', async (req, res) => {
    await importacionXLSXController.exportarXLSX(req, res);
});

export default router;