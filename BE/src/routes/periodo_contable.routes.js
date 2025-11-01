import express from 'express';
import { crearPeriodoContable, obtenerPeriodoPorId, verPeriodosContables } from '../controllers/periodoContableController.js';

const router = express.Router();

router.post('/', crearPeriodoContable);
router.get('/:id', obtenerPeriodoPorId);
router.get('/', verPeriodosContables);

export default router;
