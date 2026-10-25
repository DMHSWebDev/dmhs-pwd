const express = require('express');
const { contactLimiter } = require('../middleware/limiters');
const { botCheck } = require('../middleware/botCheck');
const { validateContact } = require('../utils/validation');
const { writeLog } = require('../middleware/logger');

const router = express.Router();

// The form ID isn't secret, but keeping it in .env lets us swap forms
// without touching code
const FORMSPREE_FORM_ID = process.env.FORMSPREE_FORM_ID || 'xeaaebqr';

// POST /api/contact (mounted at /api/contact in server.js)
// The browser only ever talks to us. We check the request, then pass it
// on to Formspree, which emails it to the teacher.
router.post('/', contactLimiter, botCheck, async (req, res) => {
    const error = validateContact(req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    const { name, email, organization, orgType, tier, currentSite, message } = req.body;

    // Only the fields we checked are sent, trimmed, in a fixed order
    const submission = {
        name: name.trim(),
        email: email.trim(),
        organization: organization?.trim() || '(none)',
        orgType: orgType || '(not given)',
        tier: tier || '(not given)',
        currentSite: currentSite?.trim() || '(none)',
        message: message.trim(),
        _subject: `Website request: ${organization?.trim() || name.trim()}`,
        _replyto: email.trim() // "Reply" in the email goes to the requester
    };

    let formspreeResponse;
    try {
        formspreeResponse = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(submission),
            signal: AbortSignal.timeout(8000)
        });
    } catch (err) {
        return res.status(502).json({ error: 'Could not send your request. Please try again later.' });
    }

    if (!formspreeResponse.ok) {
        const details = await formspreeResponse.text().catch(() => '');
        writeLog(`[${new Date().toISOString()}] FORMSPREE ERROR ${formspreeResponse.status}: ${details.slice(0, 300)}`);
        return res.status(502).json({ error: 'Could not send your request. Please try again later.' });
    }

    res.status(201).json({ success: true });
});

module.exports = router;
