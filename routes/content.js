const express = require('express');

const router = express.Router();

const DATASET = 'production';
const API_VERSION = 'v2025-02-19';
const CACHE_TIME = 60 * 1000; // 1 minute

// GROQ queries: only the fields our pages need
const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...20]{
    title,
    "slug": slug.current,
    category,
    publishedAt,
    body,
    "imageUrl": image.asset->url,
    "imageAlt": image.alt
}`;

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    category,
    publishedAt,
    body,
    "imageUrl": image.asset->url,
    "imageAlt": image.alt
}`;

const MENU_QUERY = `*[_type == "menuItem"] | order(order asc, name asc){
    name,
    section,
    price,
    description,
    soldOut
}`;

// One saved answer per query, like { savedAt, result }
const cache = new Map();

// Asks Sanity a GROQ query. Answers are reused for a minute so a busy page
// doesn't send Sanity a request for every visitor.
async function sanityQuery(query, params = {}) {
    const cacheKey = query + JSON.stringify(params);
    const saved = cache.get(cacheKey);
    if (saved && Date.now() - saved.savedAt < CACHE_TIME) {
        return saved.result;
    }

    const sanityUrl = new URL(
        `https://${process.env.SANITY_PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}`
    );
    sanityUrl.searchParams.set('query', query);
    // GROQ parameters go in the address as $name=<JSON value>
    for (const [name, value] of Object.entries(params)) {
        sanityUrl.searchParams.set(`$${name}`, JSON.stringify(value));
    }

    // Give up if Sanity takes longer than 8 seconds
    const sanityResponse = await fetch(sanityUrl, { signal: AbortSignal.timeout(8000) });
    if (!sanityResponse.ok) {
        throw new Error(`Sanity error ${sanityResponse.status}`);
    }

    const { result } = await sanityResponse.json();
    cache.set(cacheKey, { savedAt: Date.now(), result });
    return result;
}

// Rename Sanity's fields to ours, and ask for a smaller image
function cleanPost(post) {
    return {
        title: post.title,
        slug: post.slug,
        category: post.category || 'News',
        publishedAt: post.publishedAt,
        body: post.body,
        imageUrl: post.imageUrl ? post.imageUrl + '?w=1200&auto=format' : null,
        imageAlt: post.imageAlt || ''
    };
}

function sendCmsError(res, err) {
    console.error('CMS error:', err.message);
    res.status(502).json({ error: 'Could not load this right now. Try again later.' });
}

// GET /api/cms/posts (mounted at /api/cms in server.js)
router.get('/posts', async (req, res) => {
    try {
        const posts = await sanityQuery(POSTS_QUERY);
        res.json(posts.map(cleanPost));
    } catch (err) {
        sendCmsError(res, err);
    }
});

// GET /api/cms/posts/fresh-cranberry-loaves
router.get('/posts/:slug', async (req, res) => {
    // Slugs are short lowercase words with dashes. Anything else can't match.
    if (!/^[a-z0-9-]{1,60}$/.test(req.params.slug)) {
        return res.status(404).json({ error: 'Post not found.' });
    }

    try {
        const post = await sanityQuery(POST_QUERY, { slug: req.params.slug });
        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }
        res.json(cleanPost(post));
    } catch (err) {
        sendCmsError(res, err);
    }
});

// GET /api/cms/menu
router.get('/menu', async (req, res) => {
    try {
        res.json(await sanityQuery(MENU_QUERY));
    } catch (err) {
        sendCmsError(res, err);
    }
});

module.exports = router;
