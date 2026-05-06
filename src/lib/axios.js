import axios from "axios"

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development"
        ? "http://localhost:5001/api"
        : "https://fullstack-app-sxv1.onrender.com/api", // deployed backend URL
    withCredentials: true,
});