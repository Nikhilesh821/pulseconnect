const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    // For WebRTC: Let user join a room named after their userId so others can signal to them
    socket.on('join-self', (userId) => {
        socket.join(userId);
        console.log(`User ${socket.id} is now reachable at userId room: ${userId}`);
    });

    // Forwarding WebRTC signaling data
    socket.on('signal', ({ to, from, signal, type }) => {
        console.log(`Forwarding ${type} from ${from} to ${to}`);
        io.to(to).emit('signal', { from, signal, type });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Endpoint for Next.js Server Actions to trigger real-time updates
app.post('/broadcast', (req, res) => {
    const { room, event, data } = req.body;
    console.log(`Received broadcast request for room: ${room}, event: ${event}`);
    if (room && event && data) {
        io.to(room).emit(event, data);
        console.log(`Emitted ${event} to room ${room}`);
        return res.status(200).json({ success: true });
    }
    console.error('Missing parameters in broadcast request:', req.body);
    res.status(400).json({ error: 'Missing parameters' });
});

const PORT = process.env.PORT || 3001; // Heroku provides the port via process.env.PORT
server.listen(PORT, '0.0.0.0', () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
