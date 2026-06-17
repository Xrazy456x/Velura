import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import apiRoutes from "./routes/index.js";

const app = express();

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." }
});

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many contact submissions. Please try again later." }
});

app.set("etag", false);
app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(generalLimiter);
app.post("/api/auth/signup", authLimiter);
app.post("/api/auth/login", authLimiter);
app.post("/api/leads", contactLimiter);
app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
