const express = require("express");
const app = express();

const timeRouter = require("./routes/timeRoutes");

app.use(express.json());
app.use("/api", timeRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

module.exports = { app, server };
