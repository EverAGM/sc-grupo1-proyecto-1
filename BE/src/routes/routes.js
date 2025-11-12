import express from 'express';
const router = express.Router()
import cuentaContableRoutes from './cuenta_contable.routes.js';
import partidaDiariaRoutes from './partida_diaria.routes.js';
import periodoContableRoutes from './periodo_contable.routes.js';
import transaccionContableRoutes from './transaccion_contable.routes.js';
import manejoExcelRoutes from './manejo_excel.routes.js';


router.use('/cuentas-contables', cuentaContableRoutes)
router.use('/partidas-diarias', partidaDiariaRoutes)
router.use('/periodos-contables', periodoContableRoutes)
router.use('/transacciones-contables', transaccionContableRoutes)
router.use('/manejo-excel', manejoExcelRoutes)
router.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

export default router;