import { loadIcons } from '/lib/icons.js';

// Load icons for tools page using shared library
async function loadToolsIcons() {
  await loadIcons('.tools-icon[data-icon]');
}

// Load icons when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadToolsIcons);
} else {
  loadToolsIcons();
}
