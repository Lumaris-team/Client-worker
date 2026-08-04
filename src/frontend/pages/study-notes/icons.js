// Load icons for study notes page
async function loadStudyNotesIcons() {
  const iconElements = document.querySelectorAll('[data-icon]');

  console.log(`Loading ${iconElements.length} icons`);

  for (const element of iconElements) {
    const iconUrl = element.dataset.icon;
    if (!iconUrl) continue;

    console.log(`Loading icon: ${iconUrl}`);

    try {
      const response = await fetch(iconUrl);
      const svgContent = await response.text();
      element.innerHTML = svgContent;

      // Set SVG attributes for proper sizing
      const svg = element.querySelector('svg');
      if (svg) {
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
      }

      console.log(`Successfully loaded icon: ${iconUrl}`);
    } catch (error) {
      console.error(`Failed to load icon ${iconUrl}:`, error);
      element.innerHTML = `<span style="font-size:20px">⚠️</span>`;
    }
  }
}

// Load icons when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadStudyNotesIcons);
} else {
  loadStudyNotesIcons();
}
