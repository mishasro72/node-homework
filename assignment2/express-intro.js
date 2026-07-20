const express = require("express");

const app = express();

app.use(express.json());

app.get("/info", (req, res) => {
  res.json({
    message: "This is an express server",
  });
});

app.post("/echo", (req, res) => {
  res.json({
    weRecieved: req.body,
  });
});

app.post("/echo1", (req, res) => {
  const requestBody = req.body;

  res.status(201).json({
    saved: true,
    data: requestBody,
  });
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
