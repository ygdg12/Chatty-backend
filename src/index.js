import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import messageRoutes from "./routes/message.route.js"
import { createSocketServer } from "./lib/socket.js";
import cors from "cors"

import path from "path"
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
  origin:"http://localhost:5173",
  credentials:true
}))

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

if(process.env.NODE_ENV=== "production"){
  app.use(express.static(path.join(__dirname,"../frontend1/dist")))

 app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend1", "dist", "index.html"));
});

}

// Create Socket.IO server
const { io, server } = createSocketServer(app);

// Start server after DB connection
const startServer = async () => {
  try {
    // Start server immediately
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO server ready`);
    });
    
    // Try to connect to database in background
    try {
      await connectDB();
      console.log("Database connected successfully");
    } catch (dbError) {
      console.error("Database connection failed:", dbError.message);
      console.log("Server running without database connection");
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
