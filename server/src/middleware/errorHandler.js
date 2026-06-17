import { env } from "../config/env.js";

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  const status = error.statusCode || error.status || 500;
  const payload = {
    message: status === 500 ? "Internal server error" : error.message
  };

  if (env.nodeEnv !== "production") {
    payload.stack = error.stack;
  }

  console.error(error);
  res.status(status).json(payload);
}
