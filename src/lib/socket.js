import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

let io = null;
const userSocketMap = {};
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

// Get receiver socket ID
export function getReceiverSocketId(userId) {
  return userSocketMap[userId?.toString()];
}

const parseCookieHeader = (cookieHeader = "") => {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.split("=");
      acc[key] = decodeURIComponent(valueParts.join("="));
      return acc;
    }, {});
};

// Create socket server
export const createSocketServer = (app) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: frontendUrl,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie || "");
      const token = cookies.jwt;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.userId) {
        return next(new Error("Unauthorized"));
      }

      socket.userId = decoded.userId.toString();
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    const userId = socket.userId;
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap).map((id) => id.toString()));

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap).map((id) => id.toString()));
    });
  });

  return { io, server };
};

export { io };
