require('dotenv').config();

// Stop immediately if any required setting is missing
const REQUIRED_ENV = ['SESSION_SECRET', 'NASA_API_KEY', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'SANITY_PROJECT_ID'];
for (const name of REQUIRED_ENV) {
    if (!process.env[name]) {
        console.error(`Missing ${name} in .env (or in Render's Environment settings)`);
        process.exit(1);
    }
}

const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');

const { canonicalHost } = require('./middleware/canonicalHost');
const { requestLogger } = require('./middleware/logger');
const { limiter } = require('./middleware/limiters');
const { notFound, errorHandler } = require('./middleware/errors');
const pagesRouter = require('./routes/pages');
const { authRouter, ensureAdmin } = require('./routes/auth');
const guestbookRouter = require('./routes/guestbook');
const spaceRouter = require('./routes/space');
const contentRouter = require('./routes/content');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const isProduction = process.env.NODE_ENV === 'production';

// ===== 1. Security and parsing =====
// Trust the X-Forwarded-For header set by hosts like Render, so the rate
// limiter sees each visitor's real IP instead of the proxy's
app.set('trust proxy', 1);
app.use(canonicalHost);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            'img-src': ["'self'", 'data:', 'https://assets.science.nasa.gov', 'https://cdn.sanity.io']
        }
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(requestLogger);
app.use(limiter);

// ===== 2. Sessions =====
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 15 * 60 * 1000,   // 15 minutes
        httpOnly: true,           // page JavaScript cannot read it
        sameSite: 'lax',          // other sites cannot send it with their forms
        secure: isProduction      // only sent over HTTPS on the live site
    }
}));

// ===== 3. Routes =====
app.use(pagesRouter);
app.use(authRouter);
app.use('/api/guestbook', guestbookRouter);
app.use('/api/space', spaceRouter);
app.use('/api/posts', contentRouter); // public: no login needed for the news

// ===== 4. Static files, then errors =====
// `extensions: ['html']` lets /space find space.html without the extension
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));
app.use(notFound);
app.use(errorHandler);

// ===== 5. Start =====
ensureAdmin().then(() => {
    app.listen(PORT, () => console.log(`Server live on http://localhost:${PORT}`));
});
