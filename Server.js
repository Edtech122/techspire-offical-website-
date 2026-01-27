const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/placements", require("./routes/placements"));

app.get("/", (req, res) => {
  res.send("Techspire API is running");
});

app.listen(5000, () =>
  console.log("🚀 Techspire Backend running on port 5000")
);
