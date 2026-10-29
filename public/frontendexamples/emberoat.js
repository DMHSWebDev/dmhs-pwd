// Ember & Oat: draws the menu and journal from our CMS route (/api/cms),
// plus the mobile menu and the demo forms. Used by all three pages.
// Posts and menu items are typed by the owner in Sanity, so treat them like
// any outside data: everything goes in with textContent, never innerHTML.

const MENU_SECTIONS = ['Bread', 'Pastry', 'Sweets', 'Drinks'];
const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const longDate = date => new Date(date).toLocaleDateString('en-US', { dateStyle: 'long' });

document.querySelectorAll('.year').forEach(el => { el.textContent = new Date().getFullYear(); });

// Small helper: make an element with a class and some text
function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

async function getJson(url) {
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
}

function showStatus(container, message) {
    container.replaceChildren(el('p', 'status', message));
}

// Only show pictures from Sanity's image server
function postImage(post) {
    if (post.imageUrl && post.imageUrl.startsWith('https://cdn.sanity.io/')) {
        const img = el('img');
        img.src = post.imageUrl;
        img.alt = post.imageAlt;
        img.loading = 'lazy';
        return img;
    }
    // No picture: a colored block with the category name instead
    return el('span', 'post-placeholder', post.category);
}

// Blank lines in the Studio split paragraphs
const paragraphs = body => body.split(/\n\s*\n/).map(text => text.trim()).filter(Boolean);

function excerpt(body, length = 140) {
    const first = paragraphs(body)[0] || '';
    return first.length > length ? first.slice(0, length).replace(/\s+\S*$/, '') + '…' : first;
}

// ===== Mobile menu =====
const menuToggle = document.querySelector('.menu-toggle');
const siteMenu = document.querySelector('#site-menu');
menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    siteMenu.classList.toggle('is-open', open);
});
siteMenu.addEventListener('click', event => {
    if (event.target.closest('a')) {
        menuToggle.setAttribute('aria-expanded', 'false');
        siteMenu.classList.remove('is-open');
    }
});

// ===== Menu (home page) =====
function renderMenu(items) {
    const columns = MENU_SECTIONS
        .map(section => ({ section, items: items.filter(item => item.section === section) }))
        .filter(group => group.items.length > 0)
        .map(group => {
            const column = el('section', 'menu-column');
            column.append(el('h3', '', group.section));
            const list = el('ul');
            for (const item of group.items) {
                const row = el('li', item.soldOut ? 'is-sold-out' : '');
                const line = el('p', 'menu-line');
                line.append(el('span', 'menu-name', item.name), el('span', 'menu-dots'), el('span', 'menu-price', price.format(item.price)));
                row.append(line);
                if (item.description) row.append(el('p', 'menu-desc', item.description));
                if (item.soldOut) row.append(el('span', 'sold-out', 'Sold out today'));
                list.append(row);
            }
            column.append(list);
            return column;
        });
    return columns;
}

async function loadMenu(container) {
    try {
        const items = await getJson('/api/cms/menu');
        const columns = renderMenu(items);
        if (columns.length === 0) return showStatus(container, 'The menu is being updated. Check back soon!');
        container.replaceChildren(...columns);
    } catch (err) {
        showStatus(container, 'The menu couldn’t load right now. Try refreshing.');
    }
}

// ===== Post cards (home and journal) =====
function postCard(post) {
    const card = el('article', 'post-card');
    card.dataset.category = post.category;
    const link = el('a');
    link.href = `/frontendexamples/emberoat-post?slug=${encodeURIComponent(post.slug)}`;

    const frame = el('span', 'post-frame');
    frame.append(postImage(post));

    const meta = el('p', 'post-meta');
    const date = el('time', '', longDate(post.publishedAt));
    date.dateTime = post.publishedAt;
    meta.append(el('span', 'post-category', post.category), date);

    const text = el('span', 'post-text');
    text.append(meta, el('h3', '', post.title), el('p', 'post-excerpt', excerpt(post.body)));
    link.append(frame, text);
    card.append(link);
    return card;
}

async function loadLatestPosts(container) {
    try {
        const posts = await getJson('/api/cms/posts');
        if (posts.length === 0) return showStatus(container, 'No posts yet. Check back soon!');
        container.replaceChildren(...posts.slice(0, 3).map(postCard));
    } catch (err) {
        showStatus(container, 'Posts couldn’t load right now. Try refreshing.');
    }
}

// ===== Journal page: every post, with category filter chips =====
async function loadJournal(container, chipBox) {
    let posts;
    try {
        posts = await getJson('/api/cms/posts');
    } catch (err) {
        return showStatus(container, 'Posts couldn’t load right now. Try refreshing.');
    }
    if (posts.length === 0) return showStatus(container, 'No posts yet. Check back soon!');

    const cards = posts.map(postCard);
    container.replaceChildren(...cards);

    // One chip per category that has posts
    const categories = ['All', ...new Set(posts.map(post => post.category))];
    const chips = categories.map(category => {
        const chip = el('button', 'chip', category);
        chip.type = 'button';
        chip.setAttribute('aria-pressed', String(category === 'All'));
        chip.addEventListener('click', () => {
            chips.forEach(other => other.setAttribute('aria-pressed', String(other === chip)));
            cards.forEach(card => {
                card.hidden = category !== 'All' && card.dataset.category !== category;
            });
        });
        return chip;
    });
    chipBox.replaceChildren(...chips);
}

// ===== Single post page =====
async function loadPost(container) {
    const slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) return showStatus(container, 'That post could not be found.');

    let post;
    try {
        post = await getJson(`/api/cms/posts/${encodeURIComponent(slug)}`);
    } catch (err) {
        return showStatus(container, err.message === 'Post not found.' ? 'That post could not be found.' : 'This post couldn’t load right now. Try refreshing.');
    }

    document.title = `${post.title} | Ember & Oat Bakehouse`;

    const header = el('header');
    const meta = el('p', 'post-meta');
    const date = el('time', '', longDate(post.publishedAt));
    date.dateTime = post.publishedAt;
    meta.append(el('span', 'post-category', post.category), date);
    header.append(meta, el('h1', '', post.title));

    const frame = el('figure', 'post-hero');
    frame.append(postImage(post));

    const body = el('div', 'post-body');
    body.append(...paragraphs(post.body).map(text => el('p', '', text)));

    container.replaceChildren(header, frame, body);
}

// ===== Demo forms =====
// A real Storyteller site sends these to the owner's inbox. Here we only
// check the fields and explain, so nobody's message disappears.
function demoForm(form, successMessage) {
    if (!form) return;
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', event => {
        event.preventDefault();
        const firstBad = [...form.elements].find(field => field.willValidate && !field.checkValidity());
        if (firstBad) {
            status.className = 'form-status is-error';
            status.textContent = firstBad.type === 'email' ? 'Please enter a full email address.' : 'Please fill in every field.';
            firstBad.focus();
            return;
        }
        status.className = 'form-status is-ok';
        status.textContent = successMessage;
        form.reset();
    });
}

demoForm(document.querySelector('#signup-form'), 'You’re on the list! (This is a demo, so no email was saved. On a real site, the owner gets your address.)');
demoForm(document.querySelector('#contact-form'), 'Thanks! (This is a demo, so nothing was sent. On a real site, this lands in the owner’s inbox.)');

// ===== Start whatever this page needs =====
const menuGrid = document.querySelector('#menu-grid');
const latestPosts = document.querySelector('#latest-posts');
const allPosts = document.querySelector('#all-posts');
const postArticle = document.querySelector('#post');

if (menuGrid) loadMenu(menuGrid);
if (latestPosts) loadLatestPosts(latestPosts);
if (allPosts) loadJournal(allPosts, document.querySelector('#category-chips'));
if (postArticle) loadPost(postArticle);
