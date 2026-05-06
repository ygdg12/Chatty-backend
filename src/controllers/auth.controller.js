import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    
    try {
        // Validate input
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        });

        // Save user and generate token
        await newUser.save();

        generateToken(newUser._id, res);

        return res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            profilePic: newUser.profilePic,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        });

    } catch (error) {
        return res.status(500).json({ 
            message: "Internal server error",
            error: error.message
        });
    }
};

export const login = async (req, res) => {
   const {email,password}=req.body
    try {
       const user= await User.findOne({email})
       if(!user){
        return res.status(400).json({message:"Invalid credentials"})
       }
      const isPasswordCorrect= await bcrypt.compare(password,user.password)
      if(!isPasswordCorrect){
        return res.status(400).json({message:"Invalid credentials"})
      }
      generateToken (user._id,res)
      res.status(200).json({
        _id:user._id,
        fullName:user.fullName,
        email:user.email,
        profilePic:user.profilePic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })
    } catch (error) {
       res.status(500).json({message:"Internal Server Error"})
    }
};

export const logout = (req, res) => {
    try {
      res.cookie("jwt","",{maxAge:0})
      res.status(200).json({message:"Logged out good"})
    } catch (error) {
    }
};

export const updateProfile = async(req,res)=>{
  try{
    const {profilePic}=req.body;
    const userId=req.user._id;
    if(!profilePic){
        return res.status(400).json({message:"Profile pic is required"});
    }
    // Upload to cloudinary
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
    res.status(200).json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    });
  }
  catch(error){
    res.status(500).json({message: "Internal server error", error: error.message});
  }
};

export const checkAuth = (req,res)=>{
    try{
        const user = req.user;
        res.status(200).json({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          profilePic: user.profilePic,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
    } catch(error){
        res.status(500).json({message:"internal server error"})
    }
}