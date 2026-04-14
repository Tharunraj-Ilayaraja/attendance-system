


const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "attendance-system-db-tr.postgres.database.azure.com",
  database: "attendance-system", 
  password: "Raja@1978",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;