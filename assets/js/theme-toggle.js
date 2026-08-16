(function () {
  'use strict';

  var root = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');
  var themeColor = document.querySelector('#theme-color');

  if (!toggle) return;

  function setTheme(theme, savePreference) {
    var isDark = theme === 'dark';
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.querySelector('.theme-toggle__label').textContent = isDark ? 'Light' : 'Dark';

    if (themeColor) {
      themeColor.setAttribute('content', isDark ? '#17191c' : '#ffffff');
    }

    if (savePreference) {
      try {
        localStorage.setItem('color-theme', theme);
      } catch (error) {}
    }
  }

  setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

  toggle.addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
  });
}());
