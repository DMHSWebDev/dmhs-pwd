// Sends visitors from any other address (like the onrender.com one, or
// www.) to the real domain with a permanent 301 redirect, so search engines
// only ever see one copy of the site.
// Only runs when CANONICAL_HOST is set, e.g. in Render's Environment settings:
//   CANONICAL_HOST=dmhspwd.org
function canonicalHost(req, res, next) {
    const host = process.env.CANONICAL_HOST;
    if (!host || req.hostname === host || req.hostname === 'localhost') {
        return next();
    }
    res.redirect(301, `https://${host}${req.originalUrl}`);
}

module.exports = { canonicalHost };
