const express = require('express');
const path = require('path');

const router = express.Router();
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

let visitorCount = 0;

// /request.html -> /request, /index.html -> /
// Without this, the .html address is served straight from public/ and skips
// the routes below (like the bot-check clock).
router.get(/\.html$/, (req, res) => {
    let cleanPath = req.path.replace(/\.html$/, '').replace(/\/index$/, '/');
    cleanPath = cleanPath.replace(/^\/+/, '/'); // "//other-site.com" must stay on our site
    const query = req.originalUrl.slice(req.path.length);
    res.redirect(301, cleanPath + query);
});

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

router.get('/api/stats', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ visitorCount });
});

module.exports = router;
