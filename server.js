
import "./config/dns.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";

import swaggerRoutes from "./routes/swaggerRoutes.js";
import specialityRoutes from "./routes/specialityRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import conferenceRoutes from "./routes/conferenceRoutes.js";
import hallRoutes from "./routes/hallRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";

import errorHandler from "./middlewares/errorHandler.js";

// Connect Database
await connectDB();

// Connect Redis
await connectRedis();

const app = express();

// Trust the first reverse proxy.
// Ensure this matches your actual deployment topology.
app.set("trust proxy", 1);

// Allowed Origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  process.env.ADMIN_FRONTEND_URL,
  process.env.USER_FRONTEND_URL,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

// CORS Configuration
const corsOptions = {
  origin(origin, callback) {
    // Allow Postman, server-to-server requests and other
    // clients that do not send an Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }

    const error = new Error("Not allowed by CORS.");
    error.statusCode = 403;

    return callback(error);
  },

  credentials: true,
};

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(limiter);

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Swagger
app.use("/api-docs", swaggerRoutes);

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MedTalk Backend API",
    company: "SaaScraft Studio (India) Pvt. Ltd.",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/specialities", specialityRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conferences", conferenceRoutes);
app.use("/api/conferences/:conferenceId/halls", hallRoutes);
app.use("/api/conferences/:conferenceId/coupons", couponRoutes);

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
