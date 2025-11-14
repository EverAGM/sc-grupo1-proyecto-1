import express from 'express';
import { crearTransaccionContable, verTransaccionesContables, obtenerTransaccionPorId, obtenerTransaccionesPorPartida, actualizarTransaccionContable, eliminarTransaccionContable } from '../controllers/transaccionContableController.js';  

const router = express.Router();

router.get('/', verTransaccionesContables);
router.post('/', crearTransaccionContable);
router.get('/:id', obtenerTransaccionPorId);
router.get('/partida/:partida_diaria_id', obtenerTransaccionesPorPartida);
router.put('/:id', actualizarTransaccionContable);
router.delete('/:id', eliminarTransaccionContable);

export default router;