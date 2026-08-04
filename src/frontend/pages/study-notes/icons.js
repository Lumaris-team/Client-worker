import { loadIcons } from '/lib/icons.js';

// Load icons for study notes page using shared library
async function loadStudyNotesIcons() {
  await loadIcons();
}

// Load icons when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadStudyNotesIcons);
} else {
  loadStudyNotesIcons();
}
