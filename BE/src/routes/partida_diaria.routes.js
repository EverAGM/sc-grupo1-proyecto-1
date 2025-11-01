import express from 'express';
import { crearPartidaDiaria, obtenerPartidaPorId, verPartidasDiarias } from '../controllers/partidaDiariaController.js';

const router = express.Router();

router.post('/', crearPartidaDiaria);
router.get('/:id', obtenerPartidaPorId);
router.get('/', verPartidasDiarias);

export default router;