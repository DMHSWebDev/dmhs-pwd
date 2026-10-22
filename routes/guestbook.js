const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { botCheck } = require('../middleware/botCheck');
const { validateEntry } = require('../utils/validation');
const { Filter } = require('bad-words');

const filter = new Filter();
const router = express.Router();

// May this person change this entry? Authors can change their own;
// the admin can change any of them.
function canModify(req, entry) {
    return entry.authorId === req.session.userId || req.session.role === 'admin';
}

// READ ALL: GET /api/guestbook
router.get('/', requireAuth, async (req, res) => {
    const entries = await db.getAllEntries();
    res.json(entries);
});

// READ ONE: GET /api/guestbook/:id
router.get('/:id', requireAuth, async (req, res) => {
    const entry = await db.getEntryById(req.params.id);
    if (!entry) {
        return res.status(404).json({ error: 'Entry not found.' });
    }
    res.json(entry);
});

// CREATE: POST /api/guestbook
// requireAuth first (clear 401), then botCheck, then the route
router.post('/', requireAuth, botCheck, async (req, res) => {
    const { msg } = req.body;
    // The name comes from the session, so no one can post as someone else
    const name = req.session.username;

    const error = validateEntry(name, msg);
    if (error) {
        return res.status(400).json({ error });
    }
    if (filter.isProfane(msg)) {
        return res.status(400).json({ error: 'Please keep your message friendly.' });
    }

    const entry = await db.addEntry({ name, msg: msg.trim(), authorId: req.session.userId });
    res.status(201).json(entry);
});

// UPDATE: PUT /api/guestbook/:id
// Only the message can change; the author's name stays the same
router.put('/:id', requireAuth, async (req, res) => {
    const { msg } = req.body;
    const entry = await db.getEntryById(req.params.id);
    if (!entry) {
        return res.status(404).json({ error: 'Entry not found.' });
    }
    if (!canModify(req, entry)) {
        return res.status(403).json({ error: 'You can only edit your own messages.' });
    }

    const error = validateEntry(entry.name, msg);
    if (error) {
        return res.status(400).json({ error });
    }
    if (filter.isProfane(msg)) {
        return res.status(400).json({ error: 'Please keep your message friendly.' });
    }

    const updated = await db.updateEntry(entry.id, { name: entry.name, msg: msg.trim() });
    res.json(updated);
});

// DELETE: DELETE /api/guestbook/:id
// Looks up the entry first, since we can't check who wrote it otherwise
router.delete('/:id', requireAuth, async (req, res) => {
    const entry = await db.getEntryById(req.params.id);
    if (!entry) {
        return res.status(404).json({ error: 'Entry not found.' });
    }
    if (!canModify(req, entry)) {
        return res.status(403).json({ error: 'You can only delete your own messages.' });
    }

    await db.deleteEntry(entry.id);
    res.status(204).end();
});

module.exports = router;
