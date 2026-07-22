const express = require("express");
const app = express();

const userRouter = require("./routes/userRoutes");

const errorHandler  = require("./middleware/error-handler");
const  notFound = require("./middleware/not-found");

global.user_id = null;
global.users = [];
global.tasks = [];

app.use(express.json());

app.use("/api/users", userRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

// app.all("/{*splat}", (req, res) => {
//   res.status(404).json({
//     message: `No route found for ${req.method} ${req.path}`,
//   });
// });
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

module.exports = { app, server };
