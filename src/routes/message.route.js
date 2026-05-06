import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUserForSidebar, getMessages, sendMessages } from "../controllers/message.controller.js";

const router = express.Router();

// Get sidebar users
router.get("/users", protectRoute, getUserForSidebar);

// Get chat messages
router.get("/chat/:id", protectRoute, getMessages);

// Send new message
router.post("/send/:id", protectRoute, sendMessages);

export default router;
