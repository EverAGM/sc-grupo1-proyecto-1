import express from 'express';
import { crearPartidaDiaria, obtenerPartidaPorId, verPartidasDiarias, obtenerPartidasPorPeriodo, obtenerPartidasPorFechas, actualizarPartidaDiaria, eliminarPartidaDiaria} from '../controllers/partidaDiariaController.js';

const router = express.Router();
router.get('/fechas', obtenerPartidasPorFechas);    
router.get('/', verPartidasDiarias);

router.post('/', crearPartidaDiaria);
router.get('/:id', obtenerPartidaPorId);
router.get('/periodo/:id_periodo', obtenerPartidasPorPeriodo);
router.put('/:id', actualizarPartidaDiaria);
router.delete('/:id', eliminarPartidaDiaria);

export default router;