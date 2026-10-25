const form = document.querySelector('#request-form');
const message = document.querySelector('#request-message');
const button = document.querySelector('#request-button');

// Links like /request?tier=Storefront pick that package for you
const tierFromLink = new URLSearchParams(window.location.search).get('tier');
const tierSelect = document.querySelector('#tier');
if ([...tierSelect.options].some(option => option.value === tierFromLink)) {
    tierSelect.value = tierFromLink;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.textContent = '';
    message.classList.remove('ok');

    // Use the browser's own checks first, and point to the first problem
    if (!form.checkValidity()) {
        const firstBad = form.querySelector(':invalid');
        message.textContent = firstBad.validationMessage;
        firstBad.focus();
        return;
    }

    const body = Object.fromEntries(new FormData(form));
    button.disabled = true;
    button.textContent = 'Sending…';

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            message.textContent = data.error || 'Could not send your request.';
            return;
        }
        form.reset();
        message.classList.add('ok');
        message.textContent = 'Thanks! Your request was sent. We will reply by email.';
    } catch (err) {
        message.textContent = 'Could not reach the server. Check your connection.';
    } finally {
        button.disabled = false;
        button.textContent = 'Send request';
    }
});
