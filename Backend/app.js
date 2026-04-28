import express, { json } from 'express';
import gameRouter from './routes/gameRoutes.js';
import cors from 'cors';

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { init as initSocketIo } from './socketIo.js';
import path from 'path';
import { fileURLToPath } from 'url';

const SERVER_IP = `http://${process.env.SERVER_IP}:3000`;
const FRONTEND_URL = process.env.FRONTEND_URL || null;



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();
const server = http.createServer(app);
const allowedOrigins = ['http://localhost:3000', SERVER_IP, FRONTEND_URL].filter(Boolean);

const io = new SocketIOServer(server, {
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

initSocketIo(io); // Aquí inicializas Socket.io con la instancia 'io'

// Habilita CORS para todas las solicitudes
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
}));

// Ruta para archivos MP3 desde la carpeta `audio`
app.get('/audio/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'audio', fileName);
    
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).send('Archivo no encontrado');
      }
    });
  });

// Ruta estática para servir todos los archivos de la carpeta `audio`
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Imágenes de tokens para la app iPad
app.use('/images/tokens', express.static(path.join(__dirname, '../frontend/src/images/tokens_ultimix')));
app.use('/images/pokemon', express.static(path.join(__dirname, '../frontend/src/images/POKEMON')));
// Middleware para parsear JSON — preserva UIDs de barcode (números grandes) como strings
app.use(express.text({ type: 'application/json' }));
app.use((req, res, next) => {
    if (typeof req.body === 'string' && req.body) {
        try {
            req.body = JSON.parse(req.body.replace(/:(\s*)(\d{16,})/g, ':$1"$2"'));
        } catch (e) {
            return res.status(400).json({ message: 'Invalid JSON' });
        }
    }
    next();
});

// Servir el frontend buildeado en producción
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Login
app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ACCESS_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

// Usar las rutas del juego
app.use(gameRouter);

// Catch-all: cualquier ruta no reconocida devuelve el index.html de React
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});


io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado');

    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado');
    });

    // Otros manejadores de eventos...
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
