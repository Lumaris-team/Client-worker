import { loadIcons } from '/lib/icons.js';

// Load icons for files page using shared library
async function loadFilesIcons() {
  await loadIcons('.files-icon[data-icon]');
}

// Load icons when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFilesIcons);
} else {
  loadFilesIcons();
}
