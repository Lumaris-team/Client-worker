// Load icons for study notes page
async function loadStudyNotesIcons() {
  const iconElements = document.querySelectorAll('[data-icon]');
  
  for (const element of iconElements) {
    const iconUrl = element.dataset.icon;
    if (!iconUrl) continue;
    
    try {
      const response = await fetch(iconUrl);
      const svgContent = await response.text();
      element.innerHTML = svgContent;
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
