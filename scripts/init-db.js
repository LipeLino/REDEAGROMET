const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  console.log('Initializing database...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '186.202.28.227',
    user: process.env.DB_USER || 'authdb',
    password: process.env.DB_PASSWORD || 'v48Rp4wRAn!:j6',
    database: process.env.DB_NAME || 'authdb',
    port: 3306,
  });

  try {
    console.log('Connected to database');
    
    // Create users table
    console.log('Creating users table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        access_level ENUM('full', 'limited') NOT NULL
      )
    `);
    console.log('Users table created');

    // Create verification_codes table
    console.log('Creating verification_codes table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX email_idx (email)
      )
    `);
    console.log('Verification_codes table created');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await connection.end();
    console.log('Database connection closed');
  }
}

initializeDatabase();
