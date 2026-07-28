const express = require("express");
const app = express();

const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");

const errorHandler = require("./middleware/error-handler");
const notFound = require("./middleware/not-found");
const authMiddleware = require("./middleware/auth")

global.user_id = null;
global.users = [];
global.tasks = [];

app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/tasks", authMiddleware, taskRouter)
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

module.exports = { app, server };
