import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
console.log("Socket connection URL:", SOCKET_URL);

export const socket = io(SOCKET_URL, {
    autoConnect: false,
});
