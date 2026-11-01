const rateLimit = require('express-rate-limit');

// Every request: 100 per 10 seconds, per visitor
const limiter = rateLimit({
    windowMs: 10 * 1000,
    limit: 100,
    message: '<h1>429 Too Many Requests</h1><p>Please wait 10 seconds.</p>'
});

// Website requests: 5 per hour, so no one can flood our inbox
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: { error: 'Too many requests sent. Please wait an hour and try again.' }
});

// Shop checkouts: 30 per 10 minutes. Generous, since a whole classroom
// trying the demo shares one school IP address.
const checkoutLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 30,
    message: { error: 'Too many checkouts started. Please wait a few minutes and try again.' }
});

module.exports = { limiter, contactLimiter, checkoutLimiter };
