const { writeLog } = require('./logger');

const MIN_FILL_TIME = 2000; // 2 seconds, in milliseconds

// Writes a note about a caught bot to the console and server.log.
// Inside a router, req.path is only the part after the mount point ("/"),
// so req.originalUrl is used to log the full address.
function logBot(req, reason) {
    writeLog(`[${new Date().toISOString()}] BOT BLOCKED (${reason}) from ${req.ip} on ${req.originalUrl}`);
}

// Blocks bot submissions using a honeypot and a time trap.
// Bots get a fake "success" so they don't learn they were caught.
function botCheck(req, res, next) {
    // Check 1: the honeypot. Humans leave it empty.
    if (req.body.website) {
        logBot(req, 'honeypot filled');
        return res.status(201).json({});
    }

    // Check 2: the time trap. Humans need more than 2 seconds.
    const loadedAt = req.session.formLoadedAt;
    if (!loadedAt || Date.now() - loadedAt < MIN_FILL_TIME) {
        logBot(req, 'submitted too fast');
        return res.status(201).json({});
    }

    next(); // passed both checks
}

module.exports = { botCheck };
