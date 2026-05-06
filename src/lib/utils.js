import jwt from "jsonwebtoken"
const isProduction = process.env.NODE_ENV === "production";

export const getJwtCookieOptions = () => {
    const cookieOptions = {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/"
    };

    // Optional for shared parent-domain setups.
    if (process.env.COOKIE_DOMAIN) {
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    return cookieOptions;
};

export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.cookie("jwt", token, getJwtCookieOptions());
     return token
};



