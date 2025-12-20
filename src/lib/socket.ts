import { io } from "socket.io-client";

// const SOCKET_URL = "http://localhost:3001" || process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL

export const socket = io(SOCKET_URL, {
    autoConnect: false,
});
