// Asks our Sanity project for content with a GROQ query.
// Used by routes/content.js (journal and menu) and routes/shop.js (products).

const DATASET = 'production';
const API_VERSION = 'v2025-02-19';
const CACHE_TIME = 60 * 1000; // 1 minute

// One saved answer per query, like { savedAt, result }
const cache = new Map();

// Answers are reused for a minute so a busy page doesn't send Sanity a
// request for every visitor. Pass { fresh: true } to skip the cache and
// Sanity's CDN, for when the answer must be up to the second (like prices
// at checkout).
async function sanityQuery(query, params = {}, { fresh = false } = {}) {
    const cacheKey = query + JSON.stringify(params);
    const saved = cache.get(cacheKey);
    if (!fresh && saved && Date.now() - saved.savedAt < CACHE_TIME) {
        return saved.result;
    }

    // apicdn is faster but can be a little behind; api is always current
    const host = fresh ? 'api' : 'apicdn';
    const sanityUrl = new URL(
        `https://${process.env.SANITY_PROJECT_ID}.${host}.sanity.io/${API_VERSION}/data/query/${DATASET}`
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

// Changes content in Sanity, like lowering a product's stock. Needs a write
// token (SANITY_WRITE_TOKEN), which must never reach the browser.
// All the mutations in one call succeed or fail together.
// Throws an error with .status 409 when a document changed since we read it.
async function sanityMutate(mutations) {
    if (!process.env.SANITY_WRITE_TOKEN) {
        throw new Error('Missing SANITY_WRITE_TOKEN');
    }

    // visibility=sync: answer only once the change shows up in queries
    const sanityUrl = `https://${process.env.SANITY_PROJECT_ID}.api.sanity.io/${API_VERSION}/data/mutate/${DATASET}?visibility=sync`;
    const sanityResponse = await fetch(sanityUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}`
        },
        body: JSON.stringify({ mutations }),
        signal: AbortSignal.timeout(8000)
    });

    if (!sanityResponse.ok) {
        const err = new Error(`Sanity mutate error ${sanityResponse.status}`);
        err.status = sanityResponse.status;
        throw err;
    }
}

module.exports = { sanityQuery, sanityMutate };
