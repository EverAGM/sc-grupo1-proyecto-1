import express from 'express';
import cors from 'cors';
import routes from './routes/routes.js';
import { PORT } from './config.js';

const app = express();
app.use(express.json());

// Habilitar CORS (permite preflight y peticiones desde el frontend dev)
app.use(cors({
  origin: "http://localhost:5173", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

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





