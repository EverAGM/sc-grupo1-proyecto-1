import express from 'express';
import { crearPeriodoContable, obtenerPeriodoPorId, verPeriodosContables, actualizarPeriodoContable, eliminarPeriodoContable } from '../controllers/periodoContableController.js';

const router = express.Router();

router.post('/', crearPeriodoContable);
router.get('/:id', obtenerPeriodoPorId);
router.get('/', verPeriodosContables);
router.put('/:id', actualizarPeriodoContable);
router.delete('/:id', eliminarPeriodoContable);

export default router;
