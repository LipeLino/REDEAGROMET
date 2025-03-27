import mysql from 'serverless-mysql';

const db = mysql({
  config: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE || 'email_registration_db',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    connectTimeout: 20000, // Increase timeout
    // Removed invalid property 'waitForConnections'
    // Removed invalid property 'connectionLimit'
  }
});

export async function query(query: string, values: any[] = []) {
  try {
    console.log('Executing query:', query);
    console.log('With values:', values);
    
    const results = await db.query(query, values);
    await db.end();
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function transaction<T>(callback: () => Promise<T>): Promise<T> {
  try {
    await db.query('START TRANSACTION');
    const result = await callback();
    await db.query('COMMIT');
    await db.end();
    return result;
  } catch (error) {
    await db.query('ROLLBACK');
    await db.end();
    console.error('Transaction error:', error);
    throw error;
  }
}

// Initial database setup function
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database schema...');
    
    // Create users table
    await query(`
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

    // Create verification_codes table
    await query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX email_idx (email)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
