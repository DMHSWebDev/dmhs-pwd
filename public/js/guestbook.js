// Guestbook page: list, post, edit and delete messages.
// Everything a user typed goes in with textContent or .value, never innerHTML.

const gbForm = document.querySelector('#guestbook-form');
const gbName = document.querySelector('#name');
const gbMsg = document.querySelector('#msg');
const gbCount = document.querySelector('#msg-count');
const gbPostButton = document.querySelector('#post-button');
const gbFormError = document.querySelector('#form-error');
const gbList = document.querySelector('#guestbook-list');
const gbListError = document.querySelector('#list-error');
const gbLoading = document.querySelector('#list-loading');
const gbEntryCount = document.querySelector('#entry-count');

const MSG_MAX = 280;
const timeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

// "just now", "5 minutes ago", "yesterday", or a date for older messages
function timeAgo(isoDate) {
    const seconds = Math.round((new Date(isoDate) - Date.now()) / 1000);
    const abs = Math.abs(seconds);
    if (abs < 45) return 'just now';
    if (abs < 3600) return timeFormat.format(Math.round(seconds / 60), 'minute');
    if (abs < 86400) return timeFormat.format(Math.round(seconds / 3600), 'hour');
    if (abs < 7 * 86400) return timeFormat.format(Math.round(seconds / 86400), 'day');
    return new Date(isoDate).toLocaleDateString();
}

function makeButton(text, onClick, className = 'btn-text') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}

// Builds the normal (not editing) view of one message
function renderEntry(entry, isNew) {
    const li = document.createElement('li');
    li.className = 'gb-entry' + (isNew ? ' is-new' : '');

    const avatar = document.createElement('span');
    avatar.className = 'gb-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = entry.name.trim().charAt(0) || '?';

    const body = document.createElement('div');

    const head = document.createElement('div');
    head.className = 'gb-entry-head';

    const name = document.createElement('span');
    name.className = 'gb-name';
    name.textContent = entry.name;

    const time = document.createElement('time');
    time.className = 'gb-time';
    time.dateTime = entry.createdAt;
    time.title = new Date(entry.createdAt).toLocaleString();
    time.textContent = timeAgo(entry.createdAt);

    head.append(name, time);

    if (entry.updatedAt) {
        const edited = document.createElement('span');
        edited.className = 'gb-edited';
        edited.title = 'Edited ' + new Date(entry.updatedAt).toLocaleString();
        edited.textContent = '(edited)';
        head.append(edited);
    }

    const msg = document.createElement('p');
    msg.className = 'gb-msg';
    msg.textContent = entry.msg;

    const actions = document.createElement('div');
    actions.className = 'gb-actions';
    showActions(actions, li, entry);

    body.append(head, msg, actions);
    li.append(avatar, body);
    return li;
}

// The Edit / Delete buttons under a message
function showActions(actions, li, entry) {
    actions.classList.remove('confirming');
    actions.replaceChildren(
        makeButton('Edit', () => startEdit(li, entry)),
        makeButton('Delete', () => confirmDelete(actions, li, entry), 'btn-text danger')
    );
}

// Swaps the Delete button for an inline "Delete this? Yes / No"
function confirmDelete(actions, li, entry) {
    actions.classList.add('confirming');
    const question = document.createElement('span');
    question.textContent = 'Delete this message?';

    const noButton = makeButton('No', () => showActions(actions, li, entry));
    actions.replaceChildren(
        question,
        makeButton('Yes, delete', () => deleteEntry(entry.id), 'btn-text danger'),
        noButton
    );
    noButton.focus();
}

function startEdit(li, entry) {
    const body = li.lastElementChild;
    const msg = body.querySelector('.gb-msg');
    const actions = body.querySelector('.gb-actions');

    const editor = document.createElement('div');
    editor.className = 'gb-edit';

    const textarea = document.createElement('textarea');
    textarea.className = 'input';
    textarea.value = entry.msg; // .value is safe, like textContent
    textarea.maxLength = MSG_MAX;
    textarea.setAttribute('aria-label', 'Edit message');

    const cancel = () => {
        editor.replaceWith(msg);
        actions.hidden = false;
    };
    const save = () => saveEdit(entry, textarea.value);

    const buttons = document.createElement('div');
    buttons.className = 'gb-edit-buttons';
    buttons.append(
        makeButton('Save', save, 'btn btn-sm'),
        makeButton('Cancel', cancel, 'btn btn-ghost btn-sm')
    );

    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
        if (e.key === 'Escape') {
            e.stopPropagation();
            cancel();
        }
    });

    editor.append(textarea, buttons);
    msg.replaceWith(editor);
    actions.hidden = true;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

async function saveEdit(entry, newMsg) {
    gbListError.textContent = '';

    try {
        const response = await fetch(`/api/guestbook/${encodeURIComponent(entry.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: entry.name, msg: newMsg })
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            gbListError.textContent = data.error || 'Could not save your changes.';
            return;
        }
        loadMessages();
    } catch (err) {
        gbListError.textContent = 'Could not reach the server. Check your connection.';
    }
}

async function deleteEntry(id) {
    gbListError.textContent = '';

    try {
        const response = await fetch(`/api/guestbook/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            gbListError.textContent = data.error || 'Could not delete that message.';
            return;
        }
        loadMessages();
    } catch (err) {
        gbListError.textContent = 'Could not reach the server. Check your connection.';
    }
}

async function loadMessages(newId) {
    gbListError.textContent = '';

    try {
        const response = await fetch('/api/guestbook');
        const entries = await response.json().catch(() => ({}));

        if (!response.ok) {
            gbListError.textContent = entries.error || 'Could not load messages.';
            return;
        }

        gbList.replaceChildren();
        if (entries.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'gb-empty';
            empty.textContent = 'No messages yet. Be the first to say hi.';
            gbList.append(empty);
        }

        // Newest first
        [...entries].reverse().forEach(entry => {
            gbList.append(renderEntry(entry, entry.id === newId));
        });

        gbEntryCount.textContent = `${entries.length} ${entries.length === 1 ? 'message' : 'messages'}`;
        gbEntryCount.hidden = false;
    } catch (err) {
        gbListError.textContent = 'Could not reach the server. Check your connection.';
    } finally {
        gbLoading.hidden = true;
    }
}

function updateCount() {
    const length = gbMsg.value.length;
    gbCount.textContent = `${length} / ${MSG_MAX}`;
    gbCount.classList.toggle('near', length >= MSG_MAX - 40 && length < MSG_MAX);
    gbCount.classList.toggle('full', length >= MSG_MAX);
}

gbMsg.addEventListener('input', updateCount);

// Ctrl+Enter (or Cmd+Enter on a Mac) posts the message
gbMsg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        gbForm.requestSubmit();
    }
});

gbForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    gbFormError.textContent = '';
    gbPostButton.disabled = true;

    try {
        const response = await fetch('/api/guestbook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: gbName.value, msg: gbMsg.value })
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            gbFormError.textContent = data.error || 'Something went wrong. Please try again.';
            return; // keep what the user typed
        }

        gbMsg.value = ''; // keep the name for the next message
        updateCount();
        loadMessages(data.id);
    } catch (err) {
        gbFormError.textContent = 'Could not reach the server. Check your connection.';
    } finally {
        gbPostButton.disabled = false;
    }
});

// Fill in the name with the username, if the box is still empty
document.addEventListener('auth-change', (e) => {
    if (e.detail && !gbName.value) gbName.value = e.detail.username;
});

loadMessages();
