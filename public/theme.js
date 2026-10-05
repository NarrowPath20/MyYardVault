(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem('yard-vault-theme'); } catch {}
  const valid = theme => theme === 'light' || theme === 'dark';
  function apply(theme) {
    root.dataset.theme = theme;
    const button = document.getElementById('themeToggle');
    if (button) {
      const dark = theme === 'dark';
      button.textContent = dark ? '\u2600' : '\u263e';
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('aria-pressed', String(dark));
    }
  }
  apply(valid(saved) ? saved : preference.matches ? 'dark' : 'light');
  preference.addEventListener('change', event => { if (!valid(saved)) apply(event.matches ? 'dark' : 'light'); });
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      saved = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(saved);
      try { localStorage.setItem('yard-vault-theme', saved); } catch {}
    });
  });
})();
