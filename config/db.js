const mysql = require('mysql2');
require('dotenv').config();

// Create the connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1); // Exit on connection failure
  }
  console.log('✅ MySQL connected successfully');
});

module.exports = db;
