require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createUser({ email, password }) {
  const password_hash = await bcrypt.hash(password, 12);

  try {
    const r = await pool.query(
      `insert into users (email, password_hash)
       values ($1, $2)
       returning id, email, created_at`,
      [email, password_hash]
    );
    return r.rows[0];
  } catch (e) {
    if (e.code === "23505") throw new Error("EMAIL_ALREADY_EXISTS");
    throw e;
  }
}

async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT id, email, password_hash FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  return result.rows[0] || null;
}

async function login({ email, password }) {
  const r = await pool.query(
    "select id, email, password_hash from users where email = $1 limit 1",
    [email]
  );
  const user = r.rows[0];
  if (!user) throw new Error("INVALID_CREDENTIALS");

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  return { id: user.id, email: user.email };
}

module.exports = { pool, createUser, findUserByEmail, login };