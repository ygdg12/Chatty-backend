import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import mongoose from "mongoose";

const formatMessage = (message) => ({
  _id: String(message._id),
  senderId: String(message.senderId),
  receiverId: String(message.receiverId),
  text: message.text ?? "",
  image: message.image ?? null,
  createdAt: message.createdAt
});

// Get all users except logged-in user
export const getUserForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get chat messages between logged-in user and selected user
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(userToChatId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const userToChatObjectId = new mongoose.Types.ObjectId(userToChatId);

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatObjectId },
        { senderId: userToChatObjectId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages.map(formatMessage));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Send a new message
export const sendMessages = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver id" });
    }
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({ senderId, receiverId: receiverObjectId, text, image: imageUrl });
    await newMessage.save();
    const formattedMessage = formatMessage(newMessage);

    // Emit message to receiver and sender via socket if online
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    if (receiverSocketId && io) {
      io.to(receiverSocketId).emit("newMessage", formattedMessage);
    }
    if (senderSocketId && io) {
      io.to(senderSocketId).emit("newMessage", formattedMessage);
    }

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
