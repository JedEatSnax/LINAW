const knex = require('knex');
const knexfile = require('./knexfile');
const env = process.env.NODE_ENV || 'development';

const db = knex(knexfile[env]);

// Test connection
db.raw('SELECT 1+1 as result')
  .then(() => console.log('✅ Connected to Postgres SQL'))
  .catch((err) => console.error('❌ DB connection failed:', err));

module.exports = db;
