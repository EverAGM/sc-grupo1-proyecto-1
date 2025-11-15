import express from 'express';
import { crearFacturaElectronica, verFacturasElectronicas, obtenerFacturaPorId, obtenerFacturasPorPeriodo, actualizarFacturaElectronica, 
    eliminarFacturaElectronica } from '../controllers/facturacionElectronicaController.js';  

const router = express.Router();

router.get('/', verFacturasElectronicas);
router.post('/', crearFacturaElectronica);
router.get('/:id', obtenerFacturaPorId);
router.get('/periodo/:id_periodo', obtenerFacturasPorPeriodo);
router.put('/:id', actualizarFacturaElectronica);
router.delete('/:id', eliminarFacturaElectronica);

export default router;