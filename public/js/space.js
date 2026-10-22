const spaceForm = document.querySelector('#space-form');
const dateInput = document.querySelector('#date');
const statusBox = document.querySelector('#status');
const result = document.querySelector('#result');
const skeleton = document.querySelector('#skeleton');

// Don't let the date picker choose future dates
dateInput.max = new Date().toISOString().slice(0, 10);

async function loadPicture(date) {
    statusBox.textContent = '';
    result.hidden = true;
    skeleton.hidden = false;

    const url = date ? `/api/space?date=${encodeURIComponent(date)}` : '/api/space';

    try {
        const response = await fetch(url);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            statusBox.textContent = data.error || 'Could not load the picture.';
            skeleton.hidden = true;
            return;
        }

        showPicture(data);
    } catch (err) {
        statusBox.textContent = 'Could not reach the server. Check your connection.';
        skeleton.hidden = true;
    }
}

function showPicture(data) {
    document.querySelector('#title').textContent = data.title;
    document.querySelector('#date-shown').textContent = data.date;
    document.querySelector('#description').textContent = data.description;
    document.querySelector('#nasa-link').href = data.nasaPage;

    const img = document.querySelector('#picture');
    img.alt = data.description || data.title;

    // Keep the loading box up until the (often large) image has arrived
    img.onload = () => {
        skeleton.hidden = true;
        result.hidden = false;
    };
    img.onerror = () => {
        skeleton.hidden = true;
        statusBox.textContent = 'The picture could not be shown. Try the NASA link below.';
        result.hidden = false;
    };
    img.src = data.imageUrl;
}

spaceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loadPicture(dateInput.value);
});

document.querySelector('#today-button').addEventListener('click', () => {
    dateInput.value = '';
    loadPicture();
});

loadPicture(); // show the latest picture when the page opens
