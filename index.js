const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middle ware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("laptop sell center server is running");
});

app.listen(port, () => {
  console.log(`server is running at ${port}`);
});
