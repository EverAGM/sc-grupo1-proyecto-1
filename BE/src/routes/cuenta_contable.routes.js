import express from 'express';
import { crearCuentaContable, obtenerCuentaPorId, verCuentasContables, eliminarCuentaContable, actualizarCuentaContable } from '../controllers/cuentaContableController.js';  

const router = express.Router();

router.get('/', verCuentasContables);
router.post('/', crearCuentaContable);
router.get('/:id', obtenerCuentaPorId);
router.delete('/:id', eliminarCuentaContable);
router.put('/:id', actualizarCuentaContable);


export default router;
