const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'recife_fala_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

async function testarConexao() {
  try {
    const conn = await pool.getConnection();
    console.log('[MySQL] Conexão estabelecida com sucesso no banco:', process.env.DB_NAME || 'recife_fala_db');
    conn.release();
    return true;
  } catch (error) {
    console.error('[MySQL] Erro ao conectar no banco de dados:', error.message);
    return false;
  }
}

module.exports = { pool, testarConexao };
