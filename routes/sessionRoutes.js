const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  verifySession,
  createSession,
  endSession,
  precheckSession,
  getSessionsByTeacher,
  getSessionAttendance,
  getAnalysis
} = require("../controllers/sessionController");

router.post("/create", auth, createSession); // teacher only
router.post("/end/:id", endSession); //teacher only
router.post("/verify",verifySession);
router.post("/precheck", precheckSession);
router.get("/analysis",auth,getAnalysis);
router.get("/teacher/sessions",auth, getSessionsByTeacher);
router.get("/attendance/:session_id", getSessionAttendance);

module.exports = router;