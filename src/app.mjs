import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
// openssl rand -base64 32 to generate a random string secret key
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.mjs";

// routes declaration
app.use("/api/v1/users", userRouter);

// Use the error handling middleware after all routes , basically this is the last middleware

import { errorHandler } from "./middlewares/ErrorHandler.middleware.mjs";
app.use(errorHandler);

export { app };
