const express = require('express');
const Stripe = require('stripe');
const { sanityQuery, sanityMutate } = require('../utils/sanity');
const { checkoutLimiter } = require('../middleware/limiters');
const { writeLog } = require('../middleware/logger');
const db = require('../db');

const router = express.Router();

// The shop still shows products without Stripe keys. Only checkout needs them.
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// This is a demo, so refuse to run with a live key and take real money
if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
    console.error('STRIPE_SECRET_KEY is a live key. The shop demo only runs in test mode (sk_test_...).');
    process.exit(1);
}

const MAX_LINES = 20;    // different products in one cart
const MAX_QUANTITY = 10; // of any one product
const FREE_SHIPPING_CENTS = 5000; // orders of $50 or more ship free
const PICKUP_METHOD = 'In-store pickup';

const PRODUCTS_QUERY = `*[_type == "product"] | order(order asc, name asc){
    "id": _id,
    name,
    category,
    price,
    tag,
    description,
    soldOut,
    stock,
    "imageUrl": image.asset->url,
    "imageAlt": image.alt
}`;

// Only the products in this cart, read fresh from Sanity. _rev is the
// document's revision: it changes every time the document is edited.
const CART_PRODUCTS_QUERY = `*[_type == "product" && _id in $ids]{
    "id": _id, "rev": _rev, name, price, soldOut, stock, "imageUrl": image.asset->url
}`;

const toCents = dollars => Math.round(dollars * 100);

// A product with no stock number isn't counted (like a gift card).
// One that is counted sells out at 0.
const tracksStock = product => typeof product.stock === 'number';
const isSoldOut = product => Boolean(product.soldOut) || (tracksStock(product) && product.stock <= 0);

function cleanProduct(product) {
    return {
        ...product,
        tag: product.tag || '',
        description: product.description || '',
        soldOut: isSoldOut(product),
        stock: tracksStock(product) ? Math.max(product.stock, 0) : null,
        imageUrl: product.imageUrl ? product.imageUrl + '?w=800&auto=format' : null,
        imageAlt: product.imageAlt || ''
    };
}

// Turns what the browser sent into a clean list like [{ id, quantity }],
// or returns an error message. The browser only says WHAT it wants and
// HOW MANY. It never gets to say what anything costs.
function readCart(body) {
    const items = body?.items;
    if (!Array.isArray(items) || items.length === 0) return { error: 'Your cart is empty.' };
    if (items.length > MAX_LINES) return { error: `A cart can hold up to ${MAX_LINES} different items.` };

    const quantities = new Map();
    for (const item of items) {
        const { id, quantity } = item || {};
        if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) {
            return { error: 'Your cart has an item we don\'t recognize.' };
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            return { error: 'Each quantity must be a whole number, 1 or more.' };
        }
        quantities.set(id, (quantities.get(id) || 0) + quantity);
    }
    for (const quantity of quantities.values()) {
        if (quantity > MAX_QUANTITY) return { error: `You can buy up to ${MAX_QUANTITY} of each item.` };
    }

    // Ship it, or pick it up at the shop
    const fulfillment = body.fulfillment ?? 'ship';
    if (fulfillment !== 'ship' && fulfillment !== 'pickup') return { error: 'Please choose shipping or pickup.' };

    return { cart: [...quantities].map(([id, quantity]) => ({ id, quantity })), fulfillment };
}

// The shipping choices on Stripe's checkout page. Worked out on the server
// from the real total, so the browser can't claim free shipping.
function shippingOptions(totalCents) {
    const option = (name, cents, minDays, maxDays) => ({
        shipping_rate_data: {
            type: 'fixed_amount',
            display_name: name,
            fixed_amount: { amount: cents, currency: 'usd' },
            delivery_estimate: {
                minimum: { unit: 'business_day', value: minDays },
                maximum: { unit: 'business_day', value: maxDays }
            }
        }
    });
    const standard = totalCents >= FREE_SHIPPING_CENTS ? 0 : 700;
    return [
        option(standard === 0 ? 'Free standard shipping' : 'Standard shipping', standard, 3, 5),
        option('Express shipping', 1500, 1, 2)
    ];
}

// Asks Stripe about a checkout and, if it's paid, saves the payment and
// where to ship it. Asking Stripe directly (instead of trusting whatever
// reached us) means the saved details always come from Stripe itself.
async function recordPayment(sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['shipping_cost.shipping_rate'] // include the shipping option's name
    });
    if (session.payment_status !== 'paid') return;

    const shipping = session.collected_information?.shipping_details;
    const pickup = session.metadata?.fulfillment === 'pickup';
    await db.markOrderPaid(sessionId, {
        email: session.customer_details?.email,
        shippingCents: session.shipping_cost?.amount_total ?? 0,
        shippingMethod: pickup ? PICKUP_METHOD : session.shipping_cost?.shipping_rate?.display_name,
        shippingName: shipping?.name,
        shippingAddress: shipping?.address
    });
}

// Looks up the real price and stock of everything in the cart and, if there
// is enough, holds that stock by lowering it in Sanity. Returns { items },
// or { error } with a message for the shopper.
//
// Two shoppers could check out the last plant at the same moment. So each
// change says "only if this product hasn't changed since I read it"
// (ifRevisionID). If one did change, Sanity refuses the whole change with a
// 409, and we read the stock again and retry.
async function priceAndHoldStock(cart) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        const products = await sanityQuery(CART_PRODUCTS_QUERY, { ids: cart.map(item => item.id) }, { fresh: true });

        const items = [];
        const holds = [];
        for (const { id, quantity } of cart) {
            const product = products.find(p => p.id === id);
            if (!product) return { error: 'An item in your cart is no longer for sale. Please remove it.' };
            if (isSoldOut(product)) return { error: `Sorry, ${product.name} just sold out. Please remove it.` };
            if (tracksStock(product) && product.stock < quantity) {
                return { error: `Sorry, only ${product.stock} ${product.name} left. Please lower the quantity.` };
            }

            items.push({
                productId: id,
                name: product.name,
                unitCents: toCents(product.price),
                quantity,
                imageUrl: product.imageUrl,
                held: tracksStock(product)
            });
            if (tracksStock(product)) {
                holds.push({ patch: { id, ifRevisionID: product.rev, dec: { stock: quantity } } });
            }
        }

        if (holds.length === 0) return { items };
        try {
            await sanityMutate(holds); // all of the holds, or none of them
            return { items };
        } catch (err) {
            if (err.status !== 409) throw err;
            // Someone else changed one of these products. Read again.
        }
    }
    return { error: 'Lots of people are checking out right now. Please try again in a moment.' };
}

// Puts held stock back, for a checkout that never got paid
async function giveBackStock(items) {
    const returns = items
        .filter(item => item.held !== false) // rows from the database are all held
        .map(item => ({ patch: { id: item.productId, inc: { stock: item.quantity } } }));
    if (returns.length > 0) await sanityMutate(returns);
}

// The address of this site, for Stripe to send shoppers back to
function siteOrigin(req) {
    const host = process.env.CANONICAL_HOST;
    return host ? `https://${host}` : `${req.protocol}://${req.get('host')}`;
}

// What the thank-you page is allowed to see. Anyone with the link can open
// it, so: no email, no street address, no Stripe details.
function publicOrder(order) {
    const address = order.shippingAddress;
    return {
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        status: order.status,
        subtotalCents: order.totalCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents + (order.shippingCents || 0),
        shippingMethod: order.shippingMethod,
        pickup: order.shippingMethod === PICKUP_METHOD,
        shipTo: address ? `${order.shippingName}, ${address.city}, ${address.state}` : null,
        createdAt: order.createdAt,
        items: order.items
    };
}

// GET /api/shop/products (mounted at /api/shop in server.js)
router.get('/products', async (req, res) => {
    try {
        const products = await sanityQuery(PRODUCTS_QUERY);
        res.json(products.map(cleanProduct));
    } catch (err) {
        console.error('CMS error:', err.message);
        res.status(502).json({ error: 'Could not load the shop right now. Try again later.' });
    }
});

// POST /api/shop/checkout  { items: [{ id, quantity }] }
// Answers with { url } of a Stripe Checkout page to send the shopper to
router.post('/checkout', checkoutLimiter, async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ error: 'Checkout isn\'t turned on yet. Please check back soon.' });
    }

    const { cart, fulfillment, error } = readCart(req.body);
    if (error) return res.status(400).json({ error });

    // Look up the REAL name, price, and stock of each item on the server,
    // and hold the stock while the shopper pays
    let held;
    try {
        held = await priceAndHoldStock(cart);
    } catch (err) {
        console.error('CMS error:', err.message);
        return res.status(502).json({ error: 'Could not check prices right now. Please try again.' });
    }
    if (held.error) return res.status(400).json({ error: held.error });

    const { items } = held;
    const totalCents = items.reduce((sum, item) => sum + item.unitCents * item.quantity, 0);

    let session;
    try {
        session = await stripe.checkout.sessions.create({
            mode: 'payment',
            submit_type: 'pay',
            line_items: items.map(item => ({
                quantity: item.quantity,
                price_data: {
                    currency: 'usd',
                    unit_amount: item.unitCents,
                    product_data: {
                        name: item.name,
                        ...(item.imageUrl && { images: [item.imageUrl + '?w=400&fm=png'] })
                    }
                }
            })),
            // Pickup orders skip the address and shipping steps on Stripe's page
            ...(fulfillment === 'ship' && {
                shipping_address_collection: { allowed_countries: ['US'] },
                shipping_options: shippingOptions(totalCents)
            }),
            // Stripe swaps in the real session ID where {CHECKOUT_SESSION_ID} is
            success_url: `${siteOrigin(req)}/frontendexamples/potbound-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteOrigin(req)}/frontendexamples/potbound?checkout=canceled`,
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes, Stripe's shortest
            metadata: { site: 'potbound-demo', fulfillment }
        });
    } catch (err) {
        writeLog(`[${new Date().toISOString()}] STRIPE ERROR: ${err.message}`);
        await giveBackStock(items).catch(stockErr => console.error('Could not give back stock:', stockErr.message));
        return res.status(502).json({ error: 'Could not start checkout. Please try again.' });
    }

    try {
        await db.addOrder({ sessionId: session.id, totalCents, items });
    } catch (err) {
        console.error('Could not save order:', err.message);
        // Without an order, nothing would ever give this stock back, so do it
        // now, and close the Stripe page so it can't be paid
        await giveBackStock(items).catch(stockErr => console.error('Could not give back stock:', stockErr.message));
        await stripe.checkout.sessions.expire(session.id).catch(() => {});
        return res.status(500).json({ error: 'Could not start checkout. Please try again.' });
    }

    res.json({ url: session.url });
});

// GET /api/shop/orders/cs_test_abc123  (used by the thank-you page)
router.get('/orders/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    if (!/^cs_(test|live)_[A-Za-z0-9]{1,200}$/.test(sessionId)) {
        return res.status(404).json({ error: 'Order not found.' });
    }

    try {
        let order = await db.getOrderBySessionId(sessionId);
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        // Usually the webhook has marked it paid by now. If not (it can take
        // a few seconds, and there is no webhook on a laptop), ask Stripe
        // directly. Either way, Stripe is the one that says it was paid.
        if (order.status === 'pending' && stripe) {
            await recordPayment(sessionId);
            order = await db.getOrderBySessionId(sessionId);
        }

        res.json(publicOrder(order));
    } catch (err) {
        console.error('Order lookup failed:', err.message);
        res.status(500).json({ error: 'Could not look up this order right now.' });
    }
});

// POST /api/shop/webhook
// Stripe calls this when a checkout finishes or expires. It needs the raw,
// unparsed body to check Stripe's signature, so server.js mounts it BEFORE
// express.json(). Without a valid signature, anyone could fake a payment.
async function stripeWebhook(req, res) {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(503).send('Webhook not set up');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            req.get('stripe-signature'),
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        // Stripe's message is a whole paragraph; the first sentence says what failed
        writeLog(`[${new Date().toISOString()}] STRIPE WEBHOOK REJECTED from ${req.ip}: ${err.message.split('. ')[0]}`);
        return res.status(400).send('Bad signature');
    }

    const session = event.data.object;
    try {
        if (event.type === 'checkout.session.completed') {
            await recordPayment(session.id);
        } else if (event.type === 'checkout.session.expired') {
            // Abandoned checkout: put its held stock back on the shelf
            await db.expireOrder(session.id, giveBackStock);
        }
    } catch (err) {
        // A 500 tells Stripe to try again later
        console.error('Webhook error:', err.message);
        return res.status(500).send('Try again');
    }

    res.json({ received: true });
}

module.exports = { shopRouter: router, stripeWebhook };
