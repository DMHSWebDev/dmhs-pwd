const express = require('express');
const { sanityQuery } = require('../utils/sanity');

const router = express.Router();

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
