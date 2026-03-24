const rateLimiter = require('express-rate-limit')

const strictLimiter = ratelimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'too many request, try again later'},
    standardHeaders: true,
    legacyHeader: false
}) 

const apiLimiter = rateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: {
        message: 'Too many API requests, slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false
})

module.exports = {
  strictLimiter,
  apiLimiter
};