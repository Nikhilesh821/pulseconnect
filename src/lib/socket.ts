import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'], // Force WebSockets to avoid cross-domain polling issues
});

socket.on('connect', () => console.log('✅ Socket connected successfully! ID:', socket.id));
socket.on('connect_error', (err) => console.error('❌ Socket connect error:', err.message, err));
socket.on('disconnect', (reason) => console.warn('⚠️ Socket disconnected:', reason));
