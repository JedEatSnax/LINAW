const knex = require('knex');
const knexfile = require('./knexfile');
const env = process.env.NODE_ENV || 'development';

const config = knexfile[env];

const db = knex(config);

db.raw('SELECT 1')
  .then(() => console.log('✅ Connected to Postgres SQL'))
  .catch((err) => console.error('❌ DB connection failed:', err));

module.exports = db;