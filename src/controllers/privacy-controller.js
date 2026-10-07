const key = 'yard-vault-privacy';
const version = '2026-10-07';
export function initPrivacy() {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  let saved;
  try { saved = JSON.parse(localStorage.getItem(key)); } catch {}
  let session;
  try { session = sessionStorage.getItem(key); } catch {}
  banner.hidden = saved?.version === version || session === version;
  let opener;
  const close = () => {
    const hadFocus = banner.contains(document.activeElement);
    banner.hidden = true;
    if(opener)opener.focus();
    else if(hadFocus)document.querySelector('.skip-link')?.focus();
  };
  document.getElementById('cookieSave').addEventListener('click', () => {
    try { localStorage.setItem(key, JSON.stringify({version, necessaryOnly:true})); } catch {}
    close();
  });
  document.getElementById('cookieSession').addEventListener('click', () => {
    try { localStorage.removeItem(key); sessionStorage.setItem(key, version); } catch {}
    close();
  });
  document.querySelectorAll('[data-cookie-settings]').forEach(button => button.addEventListener('click', () => {
    opener = button; banner.hidden = false; document.getElementById('cookieSession').focus();
  }));
}
