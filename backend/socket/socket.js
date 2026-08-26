import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

let io; // Store the Socket.IO server instance

// Store online users
// userId -> Set of socket IDs
//
// Example:
// "user123" -> Set("socket1", "socket2")
// This means user123 is connected from 2 tabs/devices.
export const onlineUsers = new Map();

// Get the user ID from the connected socket
const getUserIdFromSocket = (socket) => {
  try {
    // Get cookies sent by the browser during the Socket.IO connection
    const rawCookie = socket.handshake.headers.cookie;

    if (rawCookie) {
      // Convert the cookie string into an object
      const parsed = cookie.parse(rawCookie);

      // Check if our JWT token exists in the cookie
      if (parsed.token) {
        // Verify the JWT and get the data stored inside it
        const decoded = jwt.verify(parsed.token, process.env.JWT_SECRET_KEY);

        // Return the userId stored inside the JWT
        return decoded?.userId;
      }
    }
  } catch (err) {
    // If cookie/JWT verification fails,
    // continue and try another method
  }

  // Fallback:
  // The client can send the userId when connecting.
  //
  // Example client:
  // io("server-url", {
  //   auth: { userId: "user123" }
  // })
  return socket.handshake.auth?.userId || null;
};

// Create and configure the Socket.IO server
export const initSocket = (server) => {
  // Allow the frontend URL to connect to Socket.IO
  const allowedOrigin = process.env.CLIENT_URL || "http://localhost:3000";

  // Attach Socket.IO to our existing HTTP server
  io = new Server(server, {
    cors: {
      origin: allowedOrigin,
      credentials: true, // Allow cookies to be sent
    },
  });

  // Runs whenever a new client connects to Socket.IO
  //
  // socket represents THIS particular connection.
  io.on("connection", (socket) => {
    // Find out which user this socket belongs to
    const userId = getUserIdFromSocket(socket);

    // If we successfully found the user's ID
    if (userId) {
      // Put this socket into a room named after the userId.
      //
      // Example:
      // userId = "user123"
      // socket.join("user123")
      //
      // Later we can send a message directly to this user:
      // io.to("user123").emit(...)
      socket.join(userId);

      // If this user does not have an entry in onlineUsers,
      // create one.
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }

      // Add this socket ID to the user's Set.
      //
      // One user can have multiple socket connections:
      //
      // user123 -> socket1
      //            socket2
      //            socket3
      onlineUsers.get(userId).add(socket.id);

      // Tell ALL connected users that this user is online
      io.emit("presence", {
        userId,
        online: true,
      });
    }

    // Listen for a "typing" event from the client
    socket.on("typing", ({ to }) => {
      // "to" is the userId of the person we want to notify
      if (userId && to) {
        // Send typing event to the "to" user's room
        io.to(to).emit("typing", {
          from: userId,
        });
      }
    });

    // Listen for a "stopTyping" event
    socket.on("stopTyping", ({ to }) => {
      if (userId && to) {
        // Tell the other user that this user stopped typing
        io.to(to).emit("stopTyping", {
          from: userId,
        });
      }
    });

    // Runs when this socket connection is disconnected
    socket.on("disconnect", () => {
      // Make sure this user exists in onlineUsers
      if (userId && onlineUsers.has(userId)) {
        // Remove THIS socket from the user's socket Set
        onlineUsers.get(userId).delete(socket.id);

        // If the user has no other connected sockets,
        // the user is completely offline.
        if (onlineUsers.get(userId).size === 0) {
          // Remove the user from onlineUsers
          onlineUsers.delete(userId);

          // Tell everyone that this user is now offline
          io.emit("presence", {
            userId,
            online: false,
          });
        }
      }
    });
  });
};

// Return the Socket.IO instance
//
// Other files can use:
// const io = getIO();
//
// Then:
// io.to(userId).emit(...)
export const getIO = () => {
  // Make sure Socket.IO has been initialized first
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }

  // Return the Socket.IO server
  return io;
};
