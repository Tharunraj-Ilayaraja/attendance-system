const pool = require("../config/db");
const getDistance = require("../utils/distance");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");

// ✅ Create Session (Teacher Only)
exports.createSession = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { latitude, longitude } = req.body;


    ;
    const token = uuidv4();
    const qrUrl = `http://localhost:3000/scan?token=${token}`;
    const qrImage = await QRCode.toDataURL(qrUrl)
    const session_code = Math.floor(100000 + Math.random() * 900000).toString();
    const radius = 50; // meters
    const teacher_id = req.user.id;
    const start_time = new Date();
    const end_time = new Date(start_time.getTime() + 5 * 60000);

    const result = await pool.query(
      `INSERT INTO sessions (teacher_id,token, latitude, longitude, radius, session_code, start_time, end_time, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING *`,
      [teacher_id,token, latitude, longitude, radius, session_code, start_time, end_time]
    );

    res.json({
      session: result.rows[0],
      
     // qrData: token,
      qrImage,
      //otp: session_code,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

//End QR
exports.endSession = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE sessions SET is_active=false WHERE id = $1 RETURNING session_code",
      [id]
    );

    res.json({
      otp: result.rows[0].session_code
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Scan QR
exports.scanQR = async (req, res) => {
  const { qr_token, latitude, longitude } = req.body;
  const user_id = req.user.id;

  try {
    const sessionResult = await pool.query(
      "SELECT * FROM sessions WHERE token=$1 AND is_active=true",
      [qr_token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired session" });
    }

    const session = sessionResult.rows[0];

    const distance = getDistance(
      latitude,
      longitude,
      session.latitude,
      session.longitude
    );

    if (distance > session.radius) {
      return res.status(403).json({ message: "You are not in range" });
    }

    // ✅ Prevent duplicate join
    const alreadyJoined = await pool.query(
      "SELECT * FROM session_logs WHERE user_id=$1 AND session_id=$2 AND event='joined'",
      [user_id, session.id]
    );

    if (alreadyJoined.rows.length > 0) {
      return res.json({ message: "Already joined" });
    }

    await pool.query(
      "INSERT INTO session_logs (user_id, session_id, event) VALUES ($1,$2,$3)",
      [user_id, session.id, "joined"]
    );

    res.json({
      message: "Enter secure mode",
      session_id: session.id,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Verify OTP
exports.verifyOTP = async (req, res) => {
  const { session_id, otp } = req.body;
  const user_id = req.user.id;

  try {
    const sessionResult = await pool.query(
      "SELECT * FROM sessions WHERE id=$1 AND is_active=true",
      [session_id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(400).json({ message: "Session not found or expired" });
    }

    const session = sessionResult.rows[0];
    const now = new Date();

    if (now > session.end_time) {
      return res.status(403).json({ message: "Session expired" });
    }

    if (session.session_code !== otp) {
      return res.status(403).json({ message: "Invalid OTP" });
    }

    // ✅ Anti-proxy check
    const logCheck = await pool.query(
      "SELECT * FROM session_logs WHERE user_id=$1 AND session_id=$2 AND event='joined'",
      [user_id, session_id]
    );

    if (logCheck.rows.length === 0) {
      return res.status(403).json({ message: "You did not join properly" });
    }

    await pool.query(
      "INSERT INTO attendance (user_id, session_id, status) VALUES ($1,$2,'present') ON CONFLICT DO NOTHING",
      [user_id, session_id]
    );

    await pool.query(
      "INSERT INTO session_logs (user_id, session_id, event) VALUES ($1,$2,'verified')",
      [user_id, session_id]
    );

    res.json({ message: "Attendance marked successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};