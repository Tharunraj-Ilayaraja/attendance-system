const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, email, hashedPassword, role]
    );

    const user = result.rows[0];
    delete user.password;

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
   console.log("here");
  const { email, password } = req.body;
  console.log(email," ",password);
 

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    

    const valid = password === user.rows[0].password//await bcrypt.compare(password, user.rows[0].password);
    console.log(process.env.JWT_SECRET);

    if (!valid)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, role : user.rows[0].role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};