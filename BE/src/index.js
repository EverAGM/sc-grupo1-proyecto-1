import express from 'express';
import routes from './routes/routes.js';
import { PORT } from './config.js';

const app = express();
app.use(express.json());

// Middleware de logging
import morgan from 'morgan';
app.use(morgan('dev'));

// Rutas
app.use('/api', routes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});


app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});





