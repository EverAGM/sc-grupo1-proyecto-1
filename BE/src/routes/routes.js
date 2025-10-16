import express from 'express';
const router = express.Router()
import cuentaContableRoutes from './cuenta_contable.routes.js';


router.use('/cuenta_contable', cuentaContableRoutes)

router.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

export default router;