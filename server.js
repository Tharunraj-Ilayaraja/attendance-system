require("dotenv").config();
const express = require("express");
const app = express();
const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const PORT = process.env.PORT || 5000;



const cors = require("cors");

app.use(cors({
  origin: ["https://attendance-system-frontend-pi.vercel.app", "http://localhost:3000"],
  credentials :true
}));



app.use(express.json());
app.use("/api/auth", authRoutes);

app.use("/api/session", sessionRoutes);

app.get("/",(req,res)=>{
    res.send("API running");
});



app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running");
});