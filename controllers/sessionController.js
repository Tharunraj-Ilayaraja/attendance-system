const pool = require("../config/db");
const getDistance = require("../utils/distance");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");



// ✅ Create Session (Teacher Only)
exports.createSession = async (req, res) => {
  try {
    

    const { latitude, longitude } = req.body;


    
    const token = uuidv4();
    const qrUrl = `${process.env.REACT_API}/join?token=${token}`;
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
      qrImage
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


exports.precheckSession = async (req, res) => {
  const { qr_token, latitude, longitude } = req.body;
  
  console.log("HITTED PRECHECK");

  try {
    const result = await pool.query(
      "SELECT * FROM sessions WHERE token=$1 AND is_active=true",
      [qr_token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Session closed" });
    }

    const session = result.rows[0];

    // ⏰ Time check
    const now = new Date();
    if (now > session.end_time) {
      return res.status(403).json({ message: "Session expired" });
    }

    // 📍 GPS check
    const distance = getDistance(
      latitude,
      longitude,
      session.latitude,
      session.longitude
    );

    if (distance > session.radius) {
      return res.status(403).json({ message: "Not in classroom range" });
    }

    const join_token = uuidv4();

    await pool.query(
    "INSERT INTO join_tokens (token, session_id, expires_at) VALUES ($1,$2,$3)",
    [join_token, session.id, Date.now() + (2 * 60 * 1000)]
    );
    

    res.json({
      message: "Allowed",
      session_id: session.id,
      join_token
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};



exports.verifySession = async (req, res) => {
  console.log("BACKEND VERIFY SESSIONS HIT");
  const { session_id, otp, reg_no ,join_token} = req.body;
  
   console.log(req.body);
   console.log(join_token);
   console.log(tokenRes);
 
 
  const tokenRes = await pool.query(
   "SELECT * FROM join_tokens WHERE token=$1",
   [join_token]
   );
  

   

  if (tokenRes.rows.length === 0) {
  return res.status(403).json({ message: "Invalid token" });
  }

  const tokenData = tokenRes.rows[0];

 if (tokenData.session_id !== Number(session_id)) {
  return res.status(403).json({ message: "Unauthorized access" });
 }

 if (Date.now() > tokenData.expires_at) {
  return res.status(403).json({ message: "Token expired" });
 }

  try {
    const session = await pool.query(
      "SELECT * FROM sessions WHERE id=$1",
      [session_id]
    );

    if (session.rows.length === 0) {
      return res.status(400).json({ message: "Invalid session" });
    }

    const s = session.rows[0];

    if (otp !== s.session_code) {
      return res.status(403).json({ message: "Wrong OTP" });
    }

    const student = await pool.query(
      "SELECT * FROM students WHERE usnid=$1",
      [reg_no]
    );

    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const user_id = student.rows[0].usnid;

    await pool.query(
      "INSERT INTO attendance (user_id, session_id) VALUES ($1,$2)",
      [user_id, session_id]
    );

    res.json({ message: "Attendance marked" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSessionsByTeacher = async (req, res) => {
  try {
    const teacher_id = req.user.id;

    const sessions = await pool.query(
      `SELECT id, start_time 
       FROM sessions 
       WHERE teacher_id=$1 
       ORDER BY start_time DESC`,
      [teacher_id]
    );

    res.json(sessions.rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSessionAttendance = async (req, res) => {
  const { session_id } = req.params;
  console.log("here");

  try {
    const result = await pool.query(
      `SELECT s.usnid, s.name
       FROM students s
       JOIN attendance a ON a.user_id = s.usnid
       WHERE a.session_id=$1`,
      [session_id]
    );

    res.json(result.rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};