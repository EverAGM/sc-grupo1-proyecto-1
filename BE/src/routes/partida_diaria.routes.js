import express from 'express';
import { crearPartidaDiaria } from '../controllers/partidaDiariaController.js';

const router = express.Router();

router.post('/', crearPartidaDiaria);

export default router;