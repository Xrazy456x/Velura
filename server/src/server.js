import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function bootstrap() {
  try {
    await connectDatabase();

    const server = app.listen(env.port, env.host, () => {
      const displayHost = env.host || "localhost";
      console.log(`API server listening on http://${displayHost}:${env.port}`);
      if (env.localOnly) {
        console.log("Local-only mode: file database enabled and outbound integrations disabled.");
      }
    });

    function shutdown(signal) {
      console.log(`${signal} received. Closing HTTP server.`);
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
