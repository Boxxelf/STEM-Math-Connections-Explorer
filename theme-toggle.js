/**
 * Light / dark theme toggle with localStorage and optional system preference.
 */
(function () {
    var STORAGE_KEY = 'cce-theme';

    function applyTheme(mode) {
        var root = document.documentElement;
        if (mode === 'dark') {
            root.classList.add('theme-dark');
        } else {
            root.classList.remove('theme-dark');
        }
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch (e) { /* ignore */ }
        syncButton();
    }

    function initialMode() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'dark' || saved === 'light') {
                return saved;
            }
        } catch (e) { /* ignore */ }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    function syncButton() {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;
        var dark = document.documentElement.classList.contains('theme-dark');
        btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
        btn.textContent = dark ? 'Light' : 'Dark';
        btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }

    window.addEventListener('DOMContentLoaded', function () {
        applyTheme(initialMode());
        var btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', function () {
                var next = document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark';
                applyTheme(next);
            });
        }
    });
})();
