const express = require('express');
const nodemailer = require('nodemailer');
const { contactLimiter } = require('../middleware/limiters');
const { botCheck } = require('../middleware/botCheck');
const { validateContact } = require('../utils/validation');
const { writeLog } = require('../middleware/logger');

const router = express.Router();

// One connection setup for the whole app, made once at startup.
// The SMTP_* settings come from Postmark (see .env). Postmark uses the
// Server API Token as both the username and the password.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Give up quickly instead of leaving the visitor waiting
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000
});

// Sent from our own address, never the visitor's: mail servers reject
// email that claims to be from a domain it didn't come from
const FROM = { name: 'DMHS PWD website', address: process.env.CONTACT_TO };

// POST /api/contact (mounted at /api/contact in server.js)
// The browser only ever talks to us. We check the request, then email it
// to the teacher through Postmark.
router.post('/', contactLimiter, botCheck, async (req, res) => {
    const error = validateContact(req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    const { name, email, organization, orgType, tier, currentSite, message } = req.body;

    // Line breaks in a subject could add fake email headers, so squash them
    const subjectName = (organization?.trim() || name.trim()).replace(/\s+/g, ' ');

    // Plain text, so nothing a visitor types can be turned into HTML
    const text = [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        `Organization: ${organization?.trim() || '(none)'}`,
        `Type: ${orgType || '(not given)'}`,
        `Package: ${tier || '(not given)'}`,
        `Current site: ${currentSite?.trim() || '(none)'}`,
        '',
        message.trim()
    ].join('\n');

    try {
        await transporter.sendMail({
            from: FROM,
            to: process.env.CONTACT_TO,
            replyTo: email.trim(), // "Reply" in the email goes to the requester
            subject: `Website request: ${subjectName}`,
            text
        });
    } catch (err) {
        writeLog(`[${new Date().toISOString()}] EMAIL ERROR: ${err.message.slice(0, 300)}`);
        return res.status(502).json({ error: 'Could not send your request. Please try again later.' });
    }

    res.status(201).json({ success: true });
});

module.exports = router;
