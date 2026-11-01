// Shared navbar for every page: links, theme toggle and mobile menu.
// Each page only needs an empty
// <header class="site-nav" id="site-nav"></header> and this script.

// No user data goes in here, so innerHTML is safe
document.querySelector('#site-nav').innerHTML = `
    <nav class="nav-inner" aria-label="Main">
        <a class="nav-brand" href="/">
            <img src="/assets/logo-nav.png" alt="" width="77" height="104">
            <span class="prompt-text"><span class="prompt">dmhs@pwd</span><span class="colon">:</span><span class="path">~</span><span class="dollar">$</span></span>
        </a>

        <div class="nav-menu" id="nav-menu">
            <a class="nav-link" href="/">Home</a>
            <a class="nav-link" href="/#services">Services</a>
            <a class="nav-link" href="/projects">Projects</a>
        </div>

        <div class="nav-account">
            <button class="theme-toggle" id="theme-toggle" type="button">
                <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
                <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            </button>
            <button class="nav-toggle" id="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Menu">
                <span></span>
            </button>
        </div>
    </nav>
`;

// "Skip to main content" link for keyboard and screen reader users
const mainContent = document.querySelector('main');
if (mainContent) {
    mainContent.id = mainContent.id || 'main';
    mainContent.tabIndex = -1; // lets the skip link move focus here
    const skipLink = document.createElement('a');
    skipLink.className = 'skip-link';
    skipLink.href = '#' + mainContent.id;
    skipLink.textContent = 'Skip to main content';
    document.body.prepend(skipLink);
}

// Links to other websites open in a new tab so our site stays open.
// Links within dmhspwd.org stay in the same tab.
function markExternalLink(link) {
    if (link.host === window.location.host || !link.protocol.startsWith('http')) return;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    // Screen readers announce that a new tab will open
    if (!link.querySelector('.new-tab-note')) {
        const note = document.createElement('span');
        note.className = 'visually-hidden new-tab-note';
        note.textContent = ' (opens in a new tab)';
        link.append(note);
    }
}

function markExternalLinks(root) {
    if (root.matches && root.matches('a[href]')) markExternalLink(root);
    if (root.querySelectorAll) root.querySelectorAll('a[href]').forEach(markExternalLink);
}

markExternalLinks(document.body);
// Catch links added later (like the footer) or given an href later
new MutationObserver((changes) => {
    for (const change of changes) {
        if (change.type === 'attributes') markExternalLinks(change.target);
        change.addedNodes.forEach(markExternalLinks);
    }
}).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });

// Light / dark toggle. theme.js already picked the starting theme.
const themeToggle = document.querySelector('#theme-toggle');

function labelThemeToggle() {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    themeToggle.setAttribute('aria-label', `Switch to ${next} mode`);
    themeToggle.title = `Switch to ${next} mode`;
}

themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
        localStorage.setItem('theme', next);
    } catch (err) {
        // Can't save it (private browsing); it still works until the page closes
    }
    labelThemeToggle();
    document.dispatchEvent(new Event('theme-change'));
});
labelThemeToggle();

const navToggle = document.querySelector('#nav-toggle');
const navMenu = document.querySelector('#nav-menu');

// Mark the link for the page we're on
for (const link of navMenu.querySelectorAll('a')) {
    if (link.getAttribute('href') === window.location.pathname) {
        link.setAttribute('aria-current', 'page');
    }
}

// Opens or closes the mobile menu, keeping its button's aria-expanded in sync
function setMenuOpen(open) {
    navToggle.setAttribute('aria-expanded', String(open));
    navMenu.classList.toggle('open', open);
}

navToggle.addEventListener('click', () => {
    setMenuOpen(navToggle.getAttribute('aria-expanded') !== 'true');
});

// Clicking outside the navbar closes the menu
document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-nav')) setMenuOpen(false);
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
});

// Following a link inside the mobile menu (like #services) should close it
navMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
});
