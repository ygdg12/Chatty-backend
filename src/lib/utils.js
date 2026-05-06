import jwt from "jsonwebtoken"
export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '15d'
    });
    
    // Set cookie options for development and production
    const isDev = process.env.NODE_ENV !== 'production';
    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        httpOnly: true,
        sameSite: isDev ? "lax" : "strict",
        secure: !isDev ? true : false
    });
     return token
};



