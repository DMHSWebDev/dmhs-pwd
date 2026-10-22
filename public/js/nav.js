// Shared navbar for every page: mobile menu, Projects dropdown, and the
// login / account popover. Each page only needs an empty
// <header class="site-nav" id="site-nav"></header> and this script.
// Talks to the existing /api/whoami, /login and /logout routes.

// No user data goes in here, so innerHTML is safe
document.querySelector('#site-nav').innerHTML = `
    <nav class="nav-inner" aria-label="Main">
        <a class="nav-brand" href="/">
            <img src="/assets/doherty-d.png" alt="" width="88" height="113">
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
