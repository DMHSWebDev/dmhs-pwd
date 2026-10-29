// Potbound: the shop, the cart, checkout, and the thank-you page.
// Products come from our server (/api/shop), which reads them from Sanity.
// Everything from outside goes in with textContent, never innerHTML.

const CART_KEY = 'potbound-cart';
const MAX_QUANTITY = 10; // the server checks this too
const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const toCents = dollars => Math.round(dollars * 100);

document.querySelectorAll('.year').forEach(el => { el.textContent = new Date().getFullYear(); });

function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

// ===== The cart lives in this browser, as { productId: quantity } =====
// localStorage can be blocked (private windows), so every use is wrapped
function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY));
        return saved && typeof saved === 'object' ? saved : {};
    } catch (err) {
        return {};
    }
}

function saveCart() {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (err) {
        // The cart still works until the page closes
    }
}

let cart = loadCart();
let products = [];
const productById = id => products.find(product => product.id === id);

// ===== Toast: a short message at the bottom of the screen =====
const toast = document.querySelector('#toast');
let toastTimer;
function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
}

// ===== Shop page =====
const productList = document.querySelector('#products');
const filterBox = document.querySelector('#filters');
const cartDialog = document.querySelector('.cart');
const cartLines = document.querySelector('#cart-lines');
const cartSubtotal = document.querySelector('#cart-subtotal');
const cartMessage = document.querySelector('#cart-message');
const checkoutButton = document.querySelector('#checkout-button');
const cartCount = document.querySelector('.cart-count');

function productCard(product) {
    const card = el('li', 'product');
    card.dataset.category = product.category;

    const frame = el('div', 'product-frame');
    if (product.imageUrl && product.imageUrl.startsWith('https://cdn.sanity.io/')) {
        const img = el('img');
        img.src = product.imageUrl;
        img.alt = product.imageAlt;
        img.loading = 'lazy';
        img.width = 800;
        img.height = 800;
        frame.append(img);
    }
    if (product.tag) frame.append(el('span', 'product-tag', product.tag));
    if (product.soldOut) frame.append(el('span', 'product-tag sold', 'Sold out'));

    const info = el('div', 'product-info');
    const title = el('p', 'product-title');
    title.append(el('strong', '', product.name), el('span', 'product-price', money(toCents(product.price))));
    info.append(title, el('p', 'product-desc', product.description));

    const button = el('button', 'btn add-button', product.soldOut ? 'Sold out' : 'Add to cart');
    button.type = 'button';
    button.disabled = product.soldOut;
    button.addEventListener('click', () => addToCart(product));

    card.append(frame, info, button);
    return card;
}

function renderFilters() {
    const categories = ['All', ...new Set(products.map(product => product.category))];
    const buttons = categories.map(category => {
        const button = el('button', 'filter', category);
        button.type = 'button';
        button.setAttribute('aria-pressed', String(category === 'All'));
        button.addEventListener('click', () => {
            buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
            productList.querySelectorAll('.product').forEach(card => {
                card.hidden = category !== 'All' && card.dataset.category !== category;
            });
        });
        return button;
    });
    filterBox.replaceChildren(...buttons);
}

function addToCart(product) {
    const quantity = cart[product.id] || 0;
    if (quantity >= MAX_QUANTITY) {
        showToast(`You can buy up to ${MAX_QUANTITY} of each item.`);
        return;
    }
    cart[product.id] = quantity + 1;
    saveCart();
    renderCart();
    showToast(`Added ${product.name} to your cart`);
}

function setQuantity(id, quantity) {
    if (quantity <= 0) delete cart[id];
    else cart[id] = Math.min(quantity, MAX_QUANTITY);
    saveCart();
    renderCart();
}

function cartLine(product, quantity) {
    const line = el('li', 'cart-line');
    if (product.imageUrl && product.imageUrl.startsWith('https://cdn.sanity.io/')) {
        const img = el('img');
        img.src = product.imageUrl;
        img.alt = '';
        line.append(img);
    }

    const info = el('div', 'cart-info');
    info.append(el('strong', '', product.name), el('span', '', money(toCents(product.price)) + ' each'));

    const stepper = el('div', 'stepper');
    const minus = el('button', 'icon-button', '−');
    minus.type = 'button';
    minus.setAttribute('aria-label', `One fewer ${product.name}`);
    minus.addEventListener('click', () => setQuantity(product.id, quantity - 1));
    const plus = el('button', 'icon-button', '+');
    plus.type = 'button';
    plus.setAttribute('aria-label', `One more ${product.name}`);
    plus.disabled = quantity >= MAX_QUANTITY;
    plus.addEventListener('click', () => setQuantity(product.id, quantity + 1));
    stepper.append(minus, el('span', 'quantity', String(quantity)), plus);

    const remove = el('button', 'text-button', 'Remove');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${product.name}`);
    remove.addEventListener('click', () => setQuantity(product.id, 0));

    info.append(stepper);
    line.append(info, el('span', 'line-total', money(toCents(product.price) * quantity)), remove);
    return line;
}

function renderCart() {
    // Drop anything that's no longer in the shop (or sold out since it was added)
    if (products.length > 0) {
        for (const id of Object.keys(cart)) {
            const product = productById(id);
            if (!product || product.soldOut) delete cart[id];
        }
        saveCart();
    }

    const entries = Object.entries(cart).filter(([id]) => productById(id));
    const itemCount = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
    cartCount.textContent = itemCount;

    if (entries.length === 0) {
        cartLines.replaceChildren(el('li', 'cart-empty', 'Your cart is empty. Every plant deserves a home!'));
    } else {
        cartLines.replaceChildren(...entries.map(([id, quantity]) => cartLine(productById(id), quantity)));
    }

    // This total is just for show. The server works out the real one.
    const subtotal = entries.reduce((sum, [id, quantity]) => sum + toCents(productById(id).price) * quantity, 0);
    cartSubtotal.textContent = money(subtotal);
    checkoutButton.disabled = entries.length === 0;
}

async function checkout() {
    cartMessage.textContent = '';
    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Taking you to Stripe…';

    // Send only product IDs and quantities, never prices
    const items = Object.entries(cart).map(([id, quantity]) => ({ id, quantity }));
    try {
        const response = await fetch('/api/shop/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not start checkout. Please try again.');
        window.location.assign(data.url); // off to Stripe's secure page
    } catch (err) {
        cartMessage.textContent = err.message === 'Failed to fetch' ? 'Could not reach the shop. Check your connection.' : err.message;
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Check out securely';
    }
}

async function startShop() {
    document.querySelector('.cart-button').addEventListener('click', () => cartDialog.showModal());
    document.querySelector('.cart-close').addEventListener('click', () => cartDialog.close());
    // Clicking the dark area beside the drawer closes it
    cartDialog.addEventListener('click', event => {
        if (event.target === cartDialog) cartDialog.close();
    });
    checkoutButton.addEventListener('click', checkout);

    // Coming back from Stripe without paying
    if (new URLSearchParams(window.location.search).get('checkout') === 'canceled') {
        showToast('Checkout canceled. Your cart is saved.');
        history.replaceState(null, '', window.location.pathname);
    }

    renderCart();
    try {
        const response = await fetch('/api/shop/products');
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error);
        products = data;
    } catch (err) {
        productList.replaceChildren(el('li', 'status', 'The shop couldn’t load right now. Try refreshing.'));
        return;
    }

    if (products.length === 0) {
        productList.replaceChildren(el('li', 'status', 'New plants are on the way. Check back soon!'));
        return;
    }
    productList.replaceChildren(...products.map(productCard));
    renderFilters();
    renderCart();
}

// ===== Thank-you page =====
const receipt = document.querySelector('#receipt');

function renderReceipt(order) {
    const head = el('div', 'receipt-head');
    if (order.status === 'paid') {
        head.append(el('span', 'receipt-icon', '✓'), el('p', 'pill pill-lime', `Order #${order.orderNumber}`), el('h1', '', 'Thank you! Your plants are on the way.'));
    } else if (order.status === 'pending') {
        head.append(el('span', 'receipt-icon waiting', '…'), el('h1', '', 'Confirming your payment with Stripe…'));
    } else {
        head.append(el('span', 'receipt-icon', '!'), el('h1', '', 'This checkout expired before it was paid.'));
    }

    const list = el('ul', 'receipt-lines');
    for (const item of order.items) {
        const line = el('li');
        line.append(el('span', '', `${item.quantity} × ${item.name}`), el('span', '', money(item.unitCents * item.quantity)));
        list.append(line);
    }
    // Shipping is only known once Stripe confirms the order
    const sums = [];
    if (order.shippingCents !== null) {
        for (const [label, cents] of [['Subtotal', order.subtotalCents], [order.shippingMethod || 'Shipping', order.shippingCents]]) {
            const row = el('p', 'receipt-sum');
            row.append(el('span', '', label), el('span', '', cents === 0 ? 'Free' : money(cents)));
            sums.push(row);
        }
    }
    const total = el('p', 'receipt-total');
    total.append(el('span', '', 'Total'), el('strong', '', money(order.totalCents)));
    const shipTo = order.shipTo ? [el('p', 'receipt-ship', `Shipping to ${order.shipTo}`)] : [];

    const note = el('p', 'receipt-note', order.status === 'paid'
        ? 'On a real shop, a receipt and tracking number would be emailed to you, and the order would show up in the owner’s dashboard.'
        : order.status === 'pending' ? 'This usually takes a few seconds.' : 'Nothing was charged. Your cart is still saved.');

    receipt.replaceChildren(head, list, ...sums, total, ...shipTo, note);
}

async function startReceipt() {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) {
        receipt.replaceChildren(el('h1', '', 'We couldn’t find that order.'));
        return;
    }

    // The payment can take a few seconds to confirm, so ask a few times
    for (let tries = 0; tries < 6; tries++) {
        let order;
        try {
            const response = await fetch(`/api/shop/orders/${encodeURIComponent(sessionId)}`);
            order = await response.json().catch(() => ({}));
            if (!response.ok) {
                receipt.replaceChildren(el('h1', '', order.error === 'Order not found.' ? 'We couldn’t find that order.' : 'We couldn’t look up your order right now. Try refreshing.'));
                return;
            }
        } catch (err) {
            receipt.replaceChildren(el('h1', '', 'Could not reach the shop. Check your connection and refresh.'));
            return;
        }

        renderReceipt(order);
        if (order.status === 'paid') {
            cart = {};
            saveCart();
            return;
        }
        if (order.status !== 'pending') return;
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

if (productList) startShop();
if (receipt) startReceipt();
