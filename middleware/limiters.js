const rateLimit = require('express-rate-limit');

// Every request: 100 per 10 seconds, per visitor
const limiter = rateLimit({
    windowMs: 10 * 1000,
    limit: 100,
    message: '<h1>429 Too Many Requests</h1><p>Please wait 10 seconds.</p>'
});

// Login and register: 10 tries per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: 'Too many login attempts. Please wait 15 minutes and try again.' }
});

// NASA lookups: 10 per minute
const spaceLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    message: { error: 'Too many space lookups. Please wait a minute.' }
});

module.exports = { limiter, authLimiter, spaceLimiter };
