import express from 'express';
import importacionCSVController from '../controllers/importacionCSVController.js';

const router = express.Router();

router.post('/importar', 
    importacionCSVController.uploadMiddleware,
    importacionCSVController.manejarErrorMulter,
    async (req, res) => {
        await importacionCSVController.importarCSV(req, res);
    }
);

router.get('/transacciones', async (req, res) => {
    await importacionCSVController.obtenerTransacciones(req, res);
});

export default router;