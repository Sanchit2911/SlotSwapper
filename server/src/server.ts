// server/src/server.ts

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { errorHandler } from "./middleware/errorHandler";

// Load routes
import authRoutes from "./routes/auth.routes";
import eventRoutes from "./routes/event.routes";
import swapRoutes from "./routes/swap.routes";

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app: Application = express();

// Security middleware
app.use(helmet()); // Set security headers
app.use(mongoSanitize()); // Prevent NoSQL injection

// Define the exact origins we want to allow
const allowedOrigins = [
  "http://localhost:5173", // local frontend
  "https://slotswapper-frontend-8oaeslx0t-sanchit-kumars-projects.vercel.app", // Vercel URL
  "https://slotswapper-frontend-5kquihuxk-sanchit-kumars-projects.vercel.app", // Vercel URL(new)
  // Add any other production Vercel URLs here
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman or server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Check if the origin is in our allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // If the origin is not in the list, reject it
      return callback(new Error("This origin is not allowed by CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"], // Explicitly allow methods
  })
);

// Handles preflight 'OPTIONS' requests globally to prevent 404s
app.options("*", cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
});

// Apply rate limiting to auth routes
app.use("/api/auth", limiter);

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/swaps", swapRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
