const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  verifySession,
  createSession,
  endSession,
  precheckSession,
  getSessionsByTeacher,
  getSessionAttendance
} = require("../controllers/sessionController");

router.post("/create", auth, createSession); // teacher only
router.post("/end/:id", endSession); //teacher only
router.post("/verify", auth, verifySession);
router.post("/precheck", precheckSession);
router.get("/teacher/sessions",auth, getSessionsByTeacher);
router.get("/attendance/:session_id", getSessionAttendance);

module.exports = router;