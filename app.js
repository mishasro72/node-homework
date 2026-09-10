const express = require("express");
const app = express();
const prisma = require("./db/prisma");

const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const analyticsRouter = require("./routes/analyticsRoutes");

const errorHandler = require("./middleware/error-handler");
const notFound = require("./middleware/not-found");
const jwtMiddleware = require("./middleware/jwtMiddleware");
const cookieParser = require("cookie-parser");

const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");

app.set("trust proxy", 1);

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(xss());

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", db: "not connected", error: err.message });
  }
});
app.use("/api/users", userRouter);
app.use("/api/tasks", jwtMiddleware, taskRouter);
app.use("/api/analytics", jwtMiddleware, analyticsRouter);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Shutting down gracefully...");

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log("HTTP server closed.");
    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

module.exports = { app, server };
