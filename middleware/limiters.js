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

// Website requests: 5 per hour, so no one can flood our inbox
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: { error: 'Too many requests sent. Please wait an hour and try again.' }
});

// Guestbook posts: 2 per minute, per account. Counted by user instead of
// by IP, since a whole classroom shares one school IP address.
// Only used after requireAuth, so there is always a userId.
const guestbookLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 2,
    keyGenerator: (req) => String(req.session.userId),
    message: { error: 'You can post 2 messages per minute. Please wait a moment and try again.' }
});

module.exports = { limiter, authLimiter, spaceLimiter, contactLimiter, guestbookLimiter };
