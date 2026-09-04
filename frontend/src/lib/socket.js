import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

let socket = null;

// Lazily creates (or reuses) a single socket connection for the whole
// tab. `autoConnect: false` because we only want to connect once we
// know the user is actually logged in (see SocketContext).
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true, // sends the "chat_token" cookie during the handshake
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

export default getSocket;
