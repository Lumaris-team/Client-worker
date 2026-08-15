# Frontend Components Directory

This directory contains reusable UI components that are shared across multiple pages in the Lumaris platform. Components are built as Web Components (Custom Elements) for maximum reusability and encapsulation.

## 📋 Table of Contents

- [Overview](#-overview)
- [Component Architecture](#-component-architecture)
- [Available Components](#-available-components)
- [Component Usage](#-component-usage)
- [Styling System](#-styling-system)
- [Development Guidelines](#-development-guidelines)
- [Best Practices](#-best-practices)

---

## 🎯 Overview

The components directory follows a Web Components-based architecture using Custom Elements v1. This approach provides:

- **Encapsulation**: Scoped CSS and JavaScript
- **Reusability**: Use components across multiple pages
- **Interoperability**: Framework-agnostic implementation
- **Maintainability**: Clear component boundaries
- **Performance**: Efficient rendering and updates

### Design Principles

- **Web Components**: Use Custom Elements for encapsulation
- **Shadow DOM**: Isolate component styles and structure
- **Accessibility**: WCAG AA compliant with ARIA labels
- **Responsive**: Mobile-first responsive design
- **Performance**: Optimized for fast rendering

---

## 🏗️ Component Architecture

### Web Components Pattern

Each component extends `HTMLElement` and uses Shadow DOM:

```javascript
class MyComponent extends HTMLElement {
  static observedAttributes = ["attribute-name"];
  
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }
  
  disconnectedCallback() {
    this.cleanup();
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    this.handleAttributeChange(name, oldValue, newValue);
  }
}

customElements.define("my-component", MyComponent);
```

### Component Lifecycle

1. **Constructor**: Initialize component state
2. **Connected Callback**: Component added to DOM
3. **Attribute Changed Callback**: Observed attributes change
4. **Disconnected Callback**: Component removed from DOM

### Styling Isolation

Components use Shadow DOM for style isolation:

```javascript
const style = `
  :host {
    /* Component container styles */
  }
  
  .internal-element {
    /* Internal element styles */
  }
`;

this.shadowRoot.innerHTML = `
  <style>${style}</style>
  <div class="internal-element">Content</div>
`;
```

---

## 🧩 Available Components

### Site Navbar (`navbar.js`)

**Purpose**: Global navigation bar for the application

**Element**: `<site-navbar>`

**Features**:
- Responsive navigation menu
- Active route highlighting
- Mobile hamburger menu
- Refresh functionality
- Settings access
- Logout functionality
- Icon-based navigation
- Collapsible more menu (mobile)

**Attributes**:
- `current`: Current active route (e.g., "home", "workspace")

**Usage**:
```html
<site-navbar current="home"></site-navbar>
```

**JavaScript Usage**:
```javascript
import './components/navbar.js';

// In your HTML
const navbar = document.createElement('site-navbar');
navbar.setAttribute('current', 'home');
document.body.appendChild(navbar);
```

**Navigation Items**:
- Home (`/pages/home`)
- Workspace (`/pages/workspace`)
- AI (`/pages/ai`)
- Study Notes (`/pages/study-notes`)
- Websites (`/pages/websites`)
- Files (`/pages/files`)
- Tools (`/pages/tools`)

**Quick Actions**:
- Refresh page (with cooldown)
- Settings (`/pages/settings`)
- Logout

**Responsive Behavior**:
- Desktop: Full navigation with labels
- Tablet: Navigation with icons only
- Mobile: Hamburger menu with more options

**Styling**:
- Glassmorphism design with backdrop blur
- Fixed positioning at top of page
- Smooth transitions and hover effects
- Dark mode support

**Custom Events**:
- `site-navbar:refresh`: Dispatched when refresh button is clicked

**Event Detail**:
```javascript
{
  current: "current_route",
  waitUntil: (promise) => { /* Add promise to wait for */ }
}
```

**Example Event Handling**:
```javascript
document.addEventListener('site-navbar:refresh', (event) => {
  const { current, waitUntil } = event.detail;
  
  // Refresh data for current page
  const refreshPromise = refreshPageData(current);
  waitUntil(refreshPromise);
});
```

**Icon System**:
Icons are loaded dynamically from SVG files:
- Home: `/assets/icons/home.svg`
- Grid: `/assets/icons/grid.svg`
- Sparkles: `/assets/icons/sparkles.svg`
- Study Notes: `/assets/icons/study-notes.svg`
- Web: `/assets/icons/web.svg`
- Database: `/assets/icons/database.svg`
- Wrench: `/assets/icons/wrench.svg`
- Settings: `/assets/icons/settings.svg`
- Refresh: `/assets/icons/refresh.svg`
- Logout: `/assets/icons/logout.svg`
- More: `/assets/icons/more.svg`

**Mobile Menu**:
- Three-dot menu for additional options
- Smooth open/close animations
- Click-outside-to-close functionality
- Accessible with ARIA attributes

**Refresh Cooldown**:
- 10-second cooldown between refreshes
- Visual feedback during cooldown
- Spinning animation during refresh
- Disabled state during cooldown

---

## 🎨 Component Usage

### Basic Usage

1. **Import component**:
```javascript
import './components/navbar.js';
```

2. **Add to HTML**:
```html
<site-navbar current="home"></site-navbar>
```

3. **Update attributes**:
```javascript
const navbar = document.querySelector('site-navbar');
navbar.setAttribute('current', 'workspace');
```

### Dynamic Usage

```javascript
// Create component programmatically
const navbar = document.createElement('site-navbar');
navbar.setAttribute('current', 'ai');
document.body.prepend(navbar);

// Listen for events
navbar.addEventListener('site-navbar:refresh', handleRefresh);
```

### Styling Customization

Components support CSS custom properties for theming:

```css
site-navbar {
  --navbar-height: 72px;
  --navbar-background: rgba(10, 16, 17, 0.28);
  --navbar-text-color: #edf5f2;
}
```

---

## 🎨 Styling System

### CSS Architecture

Components use a consistent styling approach:

**Scoped Styles**:
```css
:host {
  /* Component container */
  display: block;
  position: relative;
}

.internal-element {
  /* Internal elements */
  color: var(--text-color);
}
```

**CSS Custom Properties**:
```css
:host {
  --primary-color: #3498db;
  --text-color: #333333;
  --spacing: 16px;
}
```

**Responsive Design**:
```css
@media (max-width: 768px) {
  :host {
    /* Mobile-specific styles */
  }
}
```

### Theme Support

Components support dark/light themes:

```css
:host([data-theme="dark"]) {
  --background-color: #1a1a1a;
  --text-color: #ffffff;
}

:host([data-theme="light"]) {
  --background-color: #ffffff;
  --text-color: #333333;
}
```

### Glassmorphism Design

Many components use glassmorphism effects:

```css
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

---

## 🛠️ Development Guidelines

### Creating a New Component

1. **Create component file**:
```javascript
// components/my-component.js
class MyComponent extends HTMLElement {
  static observedAttributes = ["value", "disabled"];
  
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }
  
  disconnectedCallback() {
    this.cleanup();
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }
  
  render() {
    const style = `
      :host {
        display: block;
        padding: 16px;
        border: 1px solid #ccc;
        border-radius: 8px;
      }
      
      .content {
        color: var(--text-color, #333);
      }
    `;
    
    const template = `
      <div class="content">
        <slot></slot>
      </div>
    `;
    
    this.shadowRoot.innerHTML = `<style>${style}</style>${template}`;
  }
  
  attachEventListeners() {
    // Add event listeners
  }
  
  cleanup() {
    // Remove event listeners
  }
}

customElements.define("my-component", MyComponent);
```

2. **Use component**:
```html
<script type="module" src="./components/my-component.js"></script>
<my-component value="example">Content</my-component>
```

### Component Best Practices

**Naming Conventions**:
- Component names: kebab-case with custom-elements prefix
- CSS classes: BEM naming convention
- JavaScript methods: camelCase
- Constants: UPPER_SNAKE_CASE

**Accessibility**:
- Include ARIA labels for interactive elements
- Support keyboard navigation
- Provide focus indicators
- Use semantic HTML elements
- Include alt text for images

**Performance**:
- Minimize DOM manipulation
- Use event delegation
- Implement lazy loading for resources
- Optimize CSS selectors
- Use CSS transforms for animations

**Error Handling**:
- Implement graceful degradation
- Provide fallback content
- Log errors appropriately
- Handle missing attributes
- Validate input data

### Testing Components

**Unit Testing**:
```javascript
test('MyComponent renders correctly', () => {
  const component = document.createElement('my-component');
  component.setAttribute('value', 'test');
  document.body.appendChild(component);
  
  expect(component.shadowRoot).not.toBeNull();
  expect(component.getAttribute('value')).toBe('test');
  
  document.body.removeChild(component);
});
```

**Integration Testing**:
```javascript
test('MyComponent integrates with page', () => {
  // Test component interaction with page
  // Test event handling
  // Test attribute updates
});
```

---

## 📚 Best Practices

### Component Design

**Single Responsibility**:
- Each component should have one clear purpose
- Keep components focused and modular
- Avoid over-engineering

**Composition over Inheritance**:
- Use composition to combine components
- Prefer slots over complex internal structure
- Allow flexible content arrangement

**Props vs Attributes**:
- Use attributes for configuration
- Use props for dynamic data
- Document all public attributes

### State Management

**Local State**:
- Keep state within component when possible
- Use private properties for internal state
- Expose public methods for external control

**Global State**:
- Use events for cross-component communication
- Consider a state management library for complex apps
- Keep global state minimal

### Performance Optimization

**Lazy Loading**:
```javascript
// Load component only when needed
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      import('./components/heavy-component.js');
      observer.unobserve(entry.target);
    }
  });
});
```

**Code Splitting**:
```javascript
// Dynamic import for heavy components
const loadComponent = async () => {
  const module = await import('./components/heavy-component.js');
  // Use component
};
```

**Memoization**:
```javascript
// Cache expensive computations
const memoizedValue = useMemo(() => {
  return expensiveComputation(props.data);
}, [props.data]);
```

---

## 🔧 Troubleshooting

### Common Issues

**Component Not Rendering**:
- Check if component is properly registered
- Verify script import path
- Check browser console for errors
- Ensure customElements.define is called

**Styles Not Applying**:
- Verify Shadow DOM is attached
- Check CSS scoping
- Verify CSS custom properties
- Check browser compatibility

**Events Not Firing**:
- Verify event listeners are attached
- Check event delegation
- Verify event names match
- Check element is in DOM

**Attributes Not Updating**:
- Verify attribute is in observedAttributes
- Check attributeChangedCallback implementation
- Verify attribute name casing
- Check if attribute is being set correctly

### Debugging

**Browser DevTools**:
- Use Elements panel to inspect Shadow DOM
- Check Console for JavaScript errors
- Use Network panel to verify resource loading
- Use Performance panel to profile component

**Logging**:
```javascript
console.log('Component state:', this.state);
console.log('Attributes:', this.attributes);
console.log('Shadow DOM:', this.shadowRoot.innerHTML);
```

---

## 📚 Additional Resources

- [Web Components Documentation](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Shadow DOM Specification](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [Custom Elements Specification](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
- [Accessibility for Web Components](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

---

## 🚀 Future Enhancements

Planned component additions:

- **Modal Component**: Reusable modal/dialog system
- **Toast Component**: Notification system
- **Dropdown Component**: Accessible dropdown menus
- **Tabs Component**: Tabbed interface
- **Card Component**: Reusable card layout
- **Form Components**: Standardized form elements
- **DataTable Component**: Sortable, filterable tables
- **Chart Components**: Data visualization components

---

## 📝 Notes

- Components use Shadow DOM for style isolation
- All components are framework-agnostic
- Components support ARIA attributes for accessibility
- Responsive design is implemented across all components
- Performance optimization is a priority
- Components are designed for reusability

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>