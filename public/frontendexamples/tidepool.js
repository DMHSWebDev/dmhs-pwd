// Tidepool Print Studio: menu, gallery filter, lightbox, and scroll effects
document.documentElement.classList.add('js');

// ===== Footer year =====
document.querySelector('#year').textContent = new Date().getFullYear();

// ===== Sticky nav gets a shadow once you scroll =====
const nav = document.querySelector('.nav');
const updateNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// ===== Mobile menu =====
const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('#menu');

function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
}

menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});
menu.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenu(false);
});

// ===== Gallery filter =====
const filters = document.querySelectorAll('.filter');
const pieces = [...document.querySelectorAll('.piece')];

filters.forEach(button => {
    button.addEventListener('click', () => {
        const category = button.dataset.filter;
        filters.forEach(other => {
            const isActive = other === button;
            other.classList.toggle('is-active', isActive);
            other.setAttribute('aria-pressed', String(isActive));
        });
        pieces.forEach(piece => {
            piece.hidden = category !== 'all' && piece.dataset.category !== category;
        });
    });
});

// ===== Lightbox =====
const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxTitle = lightbox.querySelector('#lightbox-title');
const lightboxMeta = lightbox.querySelector('.lb-meta');
let current = 0;

// Only step through the pieces the filter is showing
const visiblePieces = () => pieces.filter(piece => !piece.hidden);

function showPiece(piece) {
    const button = piece.querySelector('button');
    const image = piece.querySelector('img');
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxTitle.textContent = button.dataset.title;
    lightboxMeta.textContent = button.dataset.meta;
    current = visiblePieces().indexOf(piece);
}

function step(direction) {
    const list = visiblePieces();
    showPiece(list[(current + direction + list.length) % list.length]);
}

pieces.forEach(piece => {
    piece.querySelector('button').addEventListener('click', () => {
        showPiece(piece);
        lightbox.showModal();
    });
});

lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
lightbox.querySelector('.lb-prev').addEventListener('click', () => step(-1));
lightbox.querySelector('.lb-next').addEventListener('click', () => step(1));
lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
});
// Clicking the dark backdrop (outside the card) closes it
lightbox.addEventListener('click', event => {
    const box = lightbox.getBoundingClientRect();
    const outside = event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom;
    if (outside) lightbox.close();
});

// ===== Fade sections in as they scroll into view =====
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
