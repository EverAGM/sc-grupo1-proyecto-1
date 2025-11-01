import express from 'express';
import { crearTransaccionContable } from '../controllers/transaccionContableController.js';  

const router = express.Router();

// router.get('/', verTransaccionesContables);
router.post('/', crearTransaccionContable);
// router.get('/:id', obtenerTransaccionPorId);

export default router;