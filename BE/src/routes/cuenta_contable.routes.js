import express from 'express';
import { crearCuentaContable, obtenerCuentaPorId, verCuentasContables, eliminarCuentaContable } from '../controllers/cuentaContableController.js';  

const router = express.Router();

router.get('/', verCuentasContables);
router.post('/', crearCuentaContable);
router.get('/:id', obtenerCuentaPorId);
router.delete('/:id', eliminarCuentaContable);


export default router;
