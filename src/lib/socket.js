import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
let io = null;
const userSocketMap = {};

// Get receiver socket ID
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Create socket server
export const createSocketServer = (app) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === "production"
        ? "https://fullstack-app-sxv1.onrender.com"
        : "http://localhost:5173",
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap[userId] = socket.id;
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      const disconnectedUserId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
      if (disconnectedUserId) {
        delete userSocketMap[disconnectedUserId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
      }
    });
  });

  return { io, server };
};

export { app, io };
