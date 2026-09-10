const express = require("express");
const multer = require("multer");
const path = require("path");

const { scanTender } = require("../controllers/scanController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/scan", upload.array("documents"), scanTender);

module.exports = router;
