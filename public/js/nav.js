// Shared navbar for every page: mobile menu, Projects dropdown, and the
// login / account popover. Each page only needs an empty
// <header class="site-nav" id="site-nav"></header> and this script.
// Talks to the existing /api/whoami, /login and /logout routes.

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

            <div class="dropdown">
                <button class="nav-trigger" id="projects-trigger" type="button" aria-expanded="false" aria-controls="projects-panel">
                    Projects<span class="caret" aria-hidden="true">&#9662;</span>
                </button>
                <ul class="dropdown-panel" id="projects-panel" hidden>
                    <li>
                        <a href="/projects">
                            All projects
                            <span class="item-tag">overview</span>
                        </a>
                    </li>
                    <li>
                        <a href="/guestbook">
                            Guestbook
                            <span class="item-tag">shared messages <span data-login-hint>&middot; log in first</span></span>
                        </a>
                    </li>
                    <li>
                        <a href="/space">
                            NASA Space
                            <span class="item-tag">astronomy picture of the day</span>
                        </a>
                    </li>
                    <li class="divider" role="presentation" data-admin-only hidden></li>
                    <li data-admin-only hidden>
                        <a href="/dashboard">
                            Admin Dashboard
                            <span class="item-tag">admin only</span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <div class="nav-account">
            <button class="theme-toggle" id="theme-toggle" type="button">
                <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
                <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            </button>
            <button class="nav-login" id="account-button" type="button" aria-expanded="false" aria-controls="account-panel">Log in</button>

            <div class="account-panel" id="account-panel" hidden>
                <div id="login-view">
                    <p class="kicker">Sign in</p>
                    <form class="login-form" id="login-form">
                        <label>Username
                            <input id="nav-username" name="username" type="text" autocomplete="username" required>
                        </label>
                        <label>Password
                            <input name="password" type="password" autocomplete="current-password" required>
                        </label>
                        <label class="remember"><input type="checkbox" name="rememberMe"> Remember me</label>
                        <p class="form-error" id="login-error" role="status"></p>
                        <button class="btn" type="submit">Log in</button>
                    </form>
                    <p class="form-note">New here? <a href="/register">Create an account</a></p>
                </div>

                <div id="user-view" hidden>
                    <p class="kicker">Signed in as</p>
                    <p class="account-name" id="account-name"></p>
                    <button class="btn btn-ghost" id="logout-button" type="button">Log out</button>
                </div>
            </div>

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
// Catch links added later (footer) or given an href later (NASA link)
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
const projectsTrigger = document.querySelector('#projects-trigger');
const projectsPanel = document.querySelector('#projects-panel');
const accountButton = document.querySelector('#account-button');
const accountPanel = document.querySelector('#account-panel');
const loginView = document.querySelector('#login-view');
const userView = document.querySelector('#user-view');
const loginForm = document.querySelector('#login-form');
const loginError = document.querySelector('#login-error');
const accountName = document.querySelector('#account-name');
const logoutButton = document.querySelector('#logout-button');

// Mark the link for the page we're on
for (const link of navMenu.querySelectorAll('a')) {
    if (link.getAttribute('href') === window.location.pathname) {
        link.setAttribute('aria-current', 'page');
        if (link.closest('.dropdown')) projectsTrigger.classList.add('current');
    }
}

// Opens or closes one popup, keeping its button's aria-expanded in sync
function setOpen(button, panel, open) {
    button.setAttribute('aria-expanded', String(open));
    if (panel === navMenu) {
        panel.classList.toggle('open', open);
    } else {
        panel.hidden = !open;
    }
}

function closeAll() {
    setOpen(navToggle, navMenu, false);
    setOpen(projectsTrigger, projectsPanel, false);
    setOpen(accountButton, accountPanel, false);
}

function openAccountPanel() {
    setOpen(navToggle, navMenu, false);
    setOpen(projectsTrigger, projectsPanel, false);
    setOpen(accountButton, accountPanel, true);
    if (!loginView.hidden) {
        document.querySelector('#nav-username').focus();
    }
}

navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') !== 'true';
    setOpen(accountButton, accountPanel, false);
    setOpen(navToggle, navMenu, open);
});

projectsTrigger.addEventListener('click', () => {
    const open = projectsTrigger.getAttribute('aria-expanded') !== 'true';
    setOpen(projectsTrigger, projectsPanel, open);
});

accountButton.addEventListener('click', (event) => {
    if (accountButton.getAttribute('aria-expanded') === 'true') {
        setOpen(accountButton, accountPanel, false);
    } else {
        openAccountPanel();
    }
});

// Any link with data-open-login (like "Log in" on the register page)
// opens the navbar popover instead of leaving the page
document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open-login]');
    if (opener) {
        event.preventDefault();
        event.stopPropagation();
        openAccountPanel();
        return;
    }
    // Clicking outside the navbar closes everything
    if (!event.target.closest('.site-nav')) closeAll();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
});

// Following a link inside the mobile menu (like #services) should close it
navMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeAll();
});

// Shows "Log in" or the username, and reveals admin-only links
function renderAuth(user) {
    const loggedIn = Boolean(user && user.loggedIn);

    if (loggedIn) {
        accountButton.textContent = '';
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.setAttribute('aria-hidden', 'true');
        accountButton.append(dot, user.username);
        accountName.textContent = user.username;
    } else {
        accountButton.textContent = 'Log in';
    }

    loginView.hidden = loggedIn;
    userView.hidden = !loggedIn;

    for (const el of document.querySelectorAll('[data-admin-only]')) {
        el.hidden = !(loggedIn && user.role === 'admin');
    }
    for (const el of document.querySelectorAll('[data-login-hint]')) {
        el.hidden = loggedIn;
    }

    // Let page scripts (like the guestbook) know who is logged in
    document.dispatchEvent(new CustomEvent('auth-change', { detail: loggedIn ? user : null }));
}

async function checkAuthState() {
    try {
        const response = await fetch('/api/whoami');
        renderAuth(await response.json());
    } catch (error) {
        renderAuth(null);
    }
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginError.textContent = '';

    const username = loginForm.username.value;
    const password = loginForm.password.value;
    const rememberMe = loginForm.rememberMe.checked;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe })
    });

    const data = await response.json().catch(() => ({ success: false }));

    if (data.success) {
        loginForm.reset();
        // The register page has nothing left to do once you're logged in
        if (window.location.pathname === '/register') {
            window.location.href = '/guestbook';
            return;
        }
        await checkAuthState();
        setOpen(accountButton, accountPanel, false);
    } else {
        loginError.textContent = data.error || 'Login failed. Please try again.';
    }
});

logoutButton.addEventListener('click', async () => {
    const response = await fetch('/logout', { method: 'POST' });
    const data = await response.json().catch(() => ({ success: false }));
    if (data.success) {
        window.location.href = '/';
    }
});

checkAuthState();
