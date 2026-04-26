


const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: process.env.DB_HOST,
  database: "attendance-system", 
  password: process.env.DB_PWD,
  port: 5432,
  /*ssl: {
    rejectUnauthorized: false,
  },*/
});

module.exports = pool;