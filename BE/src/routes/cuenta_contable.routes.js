import express from 'express';
import { crearCuentaContable, obtenerCuentaPorId, verCuentasContables } from '../controllers/cuentaContableController.js';  

const router = express.Router();

router.get('/', verCuentasContables);
router.post('/', crearCuentaContable);
router.get('/:id', obtenerCuentaPorId);

export default router;
