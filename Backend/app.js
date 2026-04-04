import express, { json } from 'express';
import gameRouter from './routes/gameRoutes.js';
import cors from 'cors';

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { init as initSocketIo } from './socketIo.js';
import path from 'path';
import { fileURLToPath } from 'url';

//IP MILA
//const SERVER_IP = 'http://192.168.0.2:3000';
//IP TACHO
//const SERVER_IP = 'http://192.168.68.115:3000';
//Mudblood
//const SERVER_IP = 'http://192.168.1.146:3000';
//Tachomodem
//const SERVER_IP = 'http://192.168.0.2:3000';
//Casa
const SERVER_IP = 'http://192.168.1.124:3000';


//IP Monicure
//const SERVER_IP = 'http://192.168.1.86:3000';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: ['http://localhost:3000', SERVER_IP], // Permite conexiones WebSocket desde estos orígenes
        methods: ['GET', 'POST'],
        credentials: true
    }
});

initSocketIo(io); // Aquí inicializas Socket.io con la instancia 'io'

// Habilita CORS para todas las solicitudes
app.use(cors({
    origin: ['http://localhost:3000', SERVER_IP], // Permite solicitudes desde estos orígenes
    methods: ['GET', 'POST'],
    credentials: true // Si necesitas enviar cookies o headers de autorización
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

// Usar las rutas del juego
app.use(gameRouter);


io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado');

    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado');
    });

    // Otros manejadores de eventos...
});


const PORT = 3001;  // Asegúrate de usar un puerto que no entre en conflicto con tu frontend
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
