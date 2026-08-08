// Icon paths mapping
const ICONS = {
  home: '/assets/icons/home.svg',
  grid: '/assets/icons/grid.svg',
  sparkles: '/assets/icons/sparkles.svg',
  'study-notes': '/assets/icons/study-notes.svg',
  web: '/assets/icons/web.svg',
  database: '/assets/icons/database.svg',
  wrench: '/assets/icons/wrench.svg',
  settings: '/assets/icons/settings.svg',
  refresh: '/assets/icons/refresh.svg',
  logout: '/assets/icons/logout.svg',
  more: '/assets/icons/more.svg',
  folder: '/assets/icons/folder.svg',
  personalization: '/assets/icons/personalization.svg',
  file: '/assets/icons/file.svg',
  download: '/assets/icons/download.svg',
  homework: '/assets/icons/homework.svg',
  calendar: '/assets/icons/calendar.svg',
  clock: '/assets/icons/clock.svg',
  calculator: '/assets/icons/calculator.svg',
  converter: '/assets/icons/converter.svg',
  code: '/assets/icons/code.svg',
  statistics: '/assets/icons/statistics.svg',
  upload: '/assets/icons/upload.svg',
  'chat-settings': '/assets/icons/chat-settings.svg',
  chat: '/assets/icons/chat.svg',
  checkmark: '/assets/icons/checkmark.svg',
  'eye-open': '/assets/icons/eye-open.svg',
  'eye-closed': '/assets/icons/eye-closed.svg',
  subjects: '/assets/icons/subjects.svg',
  swap: '/assets/icons/swap.svg',
  play: '/assets/icons/play.svg',
  copy: '/assets/icons/copy.svg',
  'arrow-left': '/assets/icons/arrow-left.svg',
  'arrow-right': '/assets/icons/arrow-right.svg',
  send: '/assets/icons/send.svg',
  warning: '/assets/icons/warning.svg',
};

/**
 * Load icons via fetch and inject SVG content
 * @param {string|Element} selectorOrContainer - CSS selector or container element
 * @param {Object} customIcons - Optional custom icon mapping
 */
export async function loadIcons(selectorOrContainer = '[data-icon]', customIcons = null) {
  const iconMap = customIcons || ICONS;
  const container = typeof selectorOrContainer === 'string' 
    ? document 
    : selectorOrContainer;
  const selector = typeof selectorOrContainer === 'string' 
    ? selectorOrContainer 
    : '[data-icon]';
  
  const iconElements = container.querySelectorAll(selector);
  
  for (const element of iconElements) {
    const iconUrl = element.dataset.icon;
    if (!iconUrl) continue;
    
    try {
      const response = await fetch(iconUrl);
      const svgContent = await response.text();
      element.innerHTML = svgContent;
      
      // Set SVG size if needed
      const svg = element.querySelector('svg');
      if (svg) {
        const width = element.dataset.iconWidth;
        const height = element.dataset.iconHeight;
        if (width) svg.setAttribute('width', width);
        if (height) svg.setAttribute('height', height);
      }
    } catch (error) {
      console.error(`Failed to load icon ${iconUrl}:`, error);
    }
  }
}

/**
 * Get icon path by name
 * @param {string} name - Icon name
 * @returns {string} Icon path
 */
export function getIconPath(name) {
  return ICONS[name] || null;
}

export { ICONS };
