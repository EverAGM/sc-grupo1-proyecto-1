import express from 'express';
import { crearCuentaContable, obtenerCuentaPorId } from '../controllers/cuentaContableController.js';  

const router = express.Router();

router.post('/', crearCuentaContable);
router.get('/:id', obtenerCuentaPorId);

export default router;
