const express = require("express");
const cors = require("cors");
require("dotenv").config();

const scanRoutes = require("./src/routes/scanRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Tender Keyword Scanner API Running",
  });
});

// Serve generated Excel reports
app.use("/reports", express.static("uploads"));

// API Routes
app.use("/api", scanRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
