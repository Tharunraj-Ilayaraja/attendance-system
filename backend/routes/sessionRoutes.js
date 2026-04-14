const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  scanQR,
  verifyOTP,
  createSession,
  endSession,
} = require("../controllers/sessionController");

router.post("/create", auth, createSession); // teacher only
router.post("/end/:id", endSession); //teacher only
router.post("/scan", auth, scanQR);
router.post("/verify", auth, verifyOTP);

module.exports = router;