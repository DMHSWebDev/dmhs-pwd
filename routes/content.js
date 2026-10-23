const express = require('express');

const router = express.Router();

const DATASET = 'production';
const API_VERSION = 'v2025-02-19';

// GROQ: newest 20 posts, only the fields our page needs
const POSTS_QUERY = `*[_type == "post"] | order(publishedAt desc)[0...20]{
    _id,
    title,
    body,
    publishedAt,
    "imageUrl": image.asset->url,
    "imageAlt": image.alt
}`;

const CACHE_TIME = 60 * 1000; // 1 minute
let cache = null; // will hold { posts, savedAt }

// GET /api/posts (mounted at /api/posts in server.js)
router.get('/', async (req, res) => {
    if (cache && Date.now() - cache.savedAt < CACHE_TIME) {
        return res.json(cache.posts);
    }

    const sanityUrl = new URL(
        `https://${process.env.SANITY_PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}`
    );
    sanityUrl.searchParams.set('query', POSTS_QUERY);

    let sanityResponse;
    try {
        // Give up if Sanity takes longer than 8 seconds
        sanityResponse = await fetch(sanityUrl, { signal: AbortSignal.timeout(8000) });
    } catch (err) {
        return res.status(502).json({ error: 'Could not reach the news server. Try again later.' });
    }

    if (!sanityResponse.ok) {
        console.error('Sanity error:', sanityResponse.status);
        return res.status(502).json({ error: 'Could not load the news right now.' });
    }

    const data = await sanityResponse.json();

    // Send back only what our page needs, with names we chose
    const posts = data.result.map(post => ({
        id: post._id,
        title: post.title,
        body: post.body,
        publishedAt: post.publishedAt,
        // Ask Sanity for a smaller image, 800 pixels wide
        imageUrl: post.imageUrl ? post.imageUrl + '?w=800&auto=format' : null,
        imageAlt: post.imageAlt || ''
    }));

    cache = { posts, savedAt: Date.now() };
    res.json(posts);
});

module.exports = router;
