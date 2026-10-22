// Admin dashboard. Moved out of dashboard.html because Helmet's
// Content-Security-Policy blocks inline <script> tags.

const deleteButton = document.querySelector('#delete-button');
const dashboardMessage = document.querySelector('#dashboard-message');
const statCount = document.querySelector('#stat-count');
const statLatest = document.querySelector('#stat-latest');
const statUser = document.querySelector('#stat-user');

let currentEntries = [];

async function loadStats() {
    const response = await fetch('/api/guestbook');
    if (!response.ok) {
        dashboardMessage.textContent = 'Could not load the guestbook.';
        return;
    }
    currentEntries = await response.json();

    statCount.textContent = currentEntries.length;
    const latest = currentEntries[currentEntries.length - 1];
    statLatest.textContent = latest ? new Date(latest.createdAt).toLocaleDateString() : 'none';
    deleteButton.disabled = currentEntries.length === 0;
}

document.addEventListener('auth-change', (e) => {
    statUser.textContent = e.detail ? e.detail.username : '–';
});

// There's no "delete everything" route, so delete each message one by one
deleteButton.addEventListener('click', async () => {
    if (!confirm(`Delete all ${currentEntries.length} messages? This can't be undone.`)) return;

    deleteButton.disabled = true;
    dashboardMessage.className = 'notice';
    dashboardMessage.textContent = 'Deleting…';

    let failed = 0;
    for (const entry of currentEntries) {
        const response = await fetch(`/api/guestbook/${encodeURIComponent(entry.id)}`, { method: 'DELETE' });
        if (!response.ok) failed++;
    }

    if (failed) {
        dashboardMessage.textContent = `${failed} message(s) could not be deleted.`;
    } else {
        dashboardMessage.className = 'notice ok';
        dashboardMessage.textContent = 'All messages have been deleted.';
    }
    loadStats();
});

loadStats();
