// First-load bootloader: the whole app loads after the first paint, so the
// first load is this file alone. The full stylesheet loads the same way, from
// app/ itself; the inline <style> in index.html covers the first paint.
window.__shotReady = false;
const css = document.createElement('link');
css.rel = 'stylesheet';
css.href = 'style.css';
document.head.appendChild(css);
import('./app.js').catch((err) => {
  const app = document.getElementById('app');
  if (app) {
    const box = document.createElement('div');
    box.className = 'error';
    box.setAttribute('role', 'alert');
    box.textContent = 'Could not start the app: ' + err.message;
    app.replaceChildren(box);
  }
  window.__shotReady = true;
});
