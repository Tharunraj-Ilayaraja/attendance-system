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
  console.log("Reached Login Backend");
  const { email, password } = req.body;
  console.log("Teacher Mail: ",email,"Pwd: ",password);
 

  try {
    const user = await pool.query(
      "SELECT * FROM teachers WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0)
      return res.status(400).json({ message: "teacher not found" });

    

    const valid = password === user.rows[0].password//await bcrypt.compare(password, user.rows[0].password);
    

    if (!valid)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};