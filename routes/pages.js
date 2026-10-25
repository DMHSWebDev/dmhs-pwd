const express = require('express');
const path = require('path');
const { requireLoginPage, requireAdminPage } = require('../middleware/auth');

const router = express.Router();
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

let visitorCount = 0;

router.get('/', (req, res) => {
    visitorCount++;
    console.log(`Visit #${visitorCount}: someone viewed the landing page`);
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

router.get('/projects', (req, res) => {
    visitorCount++;
    console.log(`Visit #${visitorCount}: someone viewed the projects page`);
    res.sendFile(path.join(PUBLIC_DIR, 'projects.html'));
});

router.get('/request', (req, res) => {
    req.session.formLoadedAt = Date.now(); // start the bot-check clock
    res.sendFile(path.join(PUBLIC_DIR, 'request.html'));
});

router.get('/dashboard', requireAdminPage, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html'));
});

router.get('/guestbook', requireLoginPage, (req, res) => {
    req.session.formLoadedAt = Date.now(); // start the bot-check clock
    res.sendFile(path.join(PUBLIC_DIR, 'guestbook.html'));
});

router.get('/api/stats', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ visitorCount });
});

module.exports = router;
