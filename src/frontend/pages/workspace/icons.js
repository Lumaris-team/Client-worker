import { loadIcons as loadSharedIcons } from '/lib/icons.js';

// Load icons via fetch and inject as inline SVG
async function loadIcons() {
  await loadSharedIcons();
}

// Load icons when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadIcons);
} else {
  loadIcons();
}
