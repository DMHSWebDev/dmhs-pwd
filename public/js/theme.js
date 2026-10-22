// Picks light or dark mode before the page draws, so it never flashes the
// wrong colors. Load this in <head> (not at the end of <body>).
// Uses the visitor's saved choice, or their device setting the first time.
// The toggle button that changes it lives in nav.js.

(() => {
    let saved = null;
    try {
        saved = localStorage.getItem('theme');
    } catch (err) {
        // Private browsing can block localStorage; just use the device setting
    }
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = saved || (prefersLight ? 'light' : 'dark');
})();
