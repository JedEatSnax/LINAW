const winston = require('winston');
const { nodeEnv } = require('../config/fabric')

// const nodeEnv = "development"

const logger = winston.createLogger({
  level: nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    nodeEnv === 'production'
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, stack }) =>
        `${timestamp} [${level.toUpperCase()}] ${stack || message}`
      )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

module.exports = logger;
