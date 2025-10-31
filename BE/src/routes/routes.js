import express from 'express';
const router = express.Router()
import cuentaContableRoutes from './cuenta_contable.routes.js';
import partidaDiariaRoutes from './partida_diaria.routes.js';

router.use('/cuentas-contables', cuentaContableRoutes)
router.use('/partidas-diarias', partidaDiariaRoutes)

router.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

export default router;