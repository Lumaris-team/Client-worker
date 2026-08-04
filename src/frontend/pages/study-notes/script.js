// API base URL
const API_BASE = '/api/study-notes';

// State
let currentPath = '';
let currentSubject = null;
let deleteTarget = null;
let renameTarget = null;

// Import auth functions
import { ensureSessionToken } from "/lib/auth.js";

// API call helper
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = await ensureSessionToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
  };

  const options = {
    method,
    headers,
  };

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    options.body = body;
  }

  const response = await fetch(`${API_BASE}/${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API call failed');
  }

  return data.resp;
}

// Load subjects list
async function loadSubjects() {
  try {
    const data = await apiCall('', 'GET');
    const subjectsList = document.getElementById('subjects-list');
    
    if (data.folders.length === 0) {
      subjectsList.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-text">No subjects yet</p>
          <p class="empty-state-subtext">Click the + button to add your first subject</p>
        </div>
      `;
      return;
    }
    
    subjectsList.innerHTML = data.folders.map(folder => `
      <div class="subject-block" data-path="${folder.path}" data-name="${folder.name}">
        <div class="subject-icon" data-icon="/assets/icons/folder.svg"></div>
        <div class="subject-info">
          <h3 class="subject-name">${folder.name}</h3>
          <p class="subject-count">Click to view files</p>
        </div>
        <div class="subject-actions">
          <button class="subject-action-btn rename" type="button" aria-label="Rename subject">
            <span data-icon="/assets/icons/edit.svg"></span>
          </button>
          <button class="subject-action-btn delete" type="button" aria-label="Delete subject">
            <span data-icon="/assets/icons/delete.svg"></span>
          </button>
        </div>
        <div class="subject-content" data-expanded="false">
          <div class="files-list" data-loading="false"></div>
        </div>
      </div>
    `).join('');
    
    // Add event listeners
    attachSubjectListeners();

    // Load icons
    const iconElements = subjectsList.querySelectorAll('[data-icon]');
    for (const element of iconElements) {
      const iconUrl = element.dataset.icon;
      if (!iconUrl) continue;
      try {
        const response = await fetch(iconUrl);
        const svgContent = await response.text();
        element.innerHTML = svgContent;
        // Set SVG attributes for proper sizing
        const svg = element.querySelector('svg');
        if (svg) {
          svg.setAttribute('width', '16');
          svg.setAttribute('height', '16');
        }
      } catch (error) {
        console.error(`Failed to load icon ${iconUrl}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to load subjects:', error);
    const subjectsList = document.getElementById('subjects-list');
    subjectsList.innerHTML = `
      <div class="empty-state">
        <p class="empty-state-text">Failed to load subjects</p>
        <p class="empty-state-subtext">${error.message}</p>
      </div>
    `;
  }
}

// Load files for a subject
async function loadFiles(subjectPath, subjectBlock) {
  const filesList = subjectBlock.querySelector('.files-list');
  const subjectCount = subjectBlock.querySelector('.subject-count');
  
  // Set current subject
  currentSubject = subjectPath;
  
  // Update add button
  if (window.updateAddButton) {
    window.updateAddButton();
  }
  
  try {
    filesList.dataset.loading = 'true';
    const data = await apiCall(`list/${encodeURIComponent(subjectPath)}`, 'GET');
    
    if (data.files.length === 0) {
      filesList.innerHTML = `
        <div class="empty-state" style="padding: 30px 20px; border: none;">
          <p class="empty-state-text" style="font-size: 0.95rem;">No files in this subject</p>
        </div>
      `;
      subjectCount.textContent = 'No files';
      return;
    }
    
    subjectCount.textContent = `${data.files.length} file${data.files.length > 1 ? 's' : ''}`;
    
    filesList.innerHTML = data.files.map(file => `
      <div class="file-block" data-path="${file.path}" data-name="${file.name}">
        <div class="file-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"></path>
          </svg>
        </div>
        <h4 class="file-name">${file.name}</h4>
        <div class="file-actions">
          <button class="file-action-btn rename" type="button" aria-label="Rename file">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
          <button class="file-action-btn delete" type="button" aria-label="Delete file">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
    
    attachFileListeners(subjectBlock);
  } catch (error) {
    console.error('Failed to load files:', error);
    filesList.innerHTML = `
      <div class="empty-state" style="padding: 30px 20px; border: none;">
        <p class="empty-state-text" style="font-size: 0.95rem;">Failed to load files</p>
      </div>
    `;
  } finally {
    filesList.dataset.loading = 'false';
  }
}

// Attach event listeners to subject blocks
function attachSubjectListeners() {
  const subjectBlocks = document.querySelectorAll('.subject-block');

  console.log(`Attaching listeners to ${subjectBlocks.length} subject blocks`);

  subjectBlocks.forEach(block => {
    const path = block.dataset.path;
    const name = block.dataset.name;
    const content = block.querySelector('.subject-content');

    console.log(`Subject block: path=${path}, name=${name}`);

    // Click on subject to expand/collapse
    block.addEventListener('click', (e) => {
      console.log('Subject block clicked', e.target);
      if (e.target.closest('.subject-action-btn')) {
        console.log('Click on action button, ignoring');
        return;
      }

      const isExpanded = content.dataset.expanded === 'true';
      console.log(`Is expanded: ${isExpanded}, loading: ${content.dataset.loading}`);

      if (!isExpanded && content.dataset.loading === 'false') {
        content.dataset.expanded = 'true';
        loadFiles(path, block);
      } else {
        content.dataset.expanded = 'false';
        // Reset current subject when collapsing
        currentSubject = null;
        if (window.updateAddButton) {
          window.updateAddButton();
        }
      }
    });
    
    // Rename button
    const renameBtn = block.querySelector('.subject-action-btn.rename');
    if (renameBtn) {
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        renameTarget = { type: 'folder', path, name };
        openModal('rename-modal');
        document.getElementById('rename-name').value = name;
      });
    }
    
    // Delete button
    const deleteBtn = block.querySelector('.subject-action-btn.delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTarget = { type: 'folder', path, name };
        openModal('delete-modal');
      });
    }
  });
}

// Attach event listeners to file blocks
function attachFileListeners(subjectBlock) {
  const fileBlocks = subjectBlock.querySelectorAll('.file-block');
  
  fileBlocks.forEach(block => {
    const path = block.dataset.path;
    const name = block.dataset.name;
    
    // Rename button
    const renameBtn = block.querySelector('.file-action-btn.rename');
    if (renameBtn) {
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        renameTarget = { type: 'file', path, name };
        openModal('rename-modal');
        document.getElementById('rename-name').value = name;
      });
    }
    
    // Delete button
    const deleteBtn = block.querySelector('.file-action-btn.delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTarget = { type: 'file', path, name };
        openModal('delete-modal');
      });
    }
  });
}

// Tab switching
function setupTabs() {
  const aiTabBtn = document.getElementById('ai-tab-btn');
  const homeworksTabBtn = document.getElementById('homeworks-tab-btn');
  const aiTab = document.getElementById('ai-tab');
  const homeworksTab = document.getElementById('homeworks-tab');
  
  aiTabBtn.addEventListener('click', () => {
    aiTabBtn.dataset.active = 'true';
    homeworksTabBtn.dataset.active = 'false';
    aiTab.dataset.active = 'true';
    homeworksTab.dataset.active = 'false';
  });
  
  homeworksTabBtn.addEventListener('click', () => {
    homeworksTabBtn.dataset.active = 'true';
    aiTabBtn.dataset.active = 'false';
    homeworksTab.dataset.active = 'true';
    aiTab.dataset.active = 'false';
    loadSubjects();
  });
}

// Modal helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.setAttribute('aria-hidden', 'true');
}

// Setup modals
function setupModals() {
  // Add subject modal
  const addSubjectBtn = document.getElementById('add-subject-btn');
  const addSubjectModal = document.getElementById('add-subject-modal');
  const addSubjectForm = document.getElementById('add-subject-form');
  const cancelAddSubjectBtn = document.getElementById('cancel-add-subject-btn');
  
  addSubjectBtn.addEventListener('click', () => openModal('add-subject-modal'));
  cancelAddSubjectBtn.addEventListener('click', () => closeModal('add-subject-modal'));
  
  addSubjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('subject-name').value.trim();
    const submitBtn = addSubjectForm.querySelector('button[type="submit"]');
    
    if (!name) return;
    
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
    
    try {
      await apiCall('folder', 'POST', { relativePath: name });
      closeModal('add-subject-modal');
      addSubjectForm.reset();
      loadSubjects();
    } catch (error) {
      console.error('Failed to add subject:', error);
      alert('Failed to add subject: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      submitBtn.style.cursor = '';
    }
  });
  
  // Add file modal (shown when in a subject)
  const addFileModal = document.getElementById('add-file-modal');
  const addFileForm = document.getElementById('add-file-form');
  const cancelAddFileBtn = document.getElementById('cancel-add-file-btn');
  
  cancelAddFileBtn.addEventListener('click', () => closeModal('add-file-modal'));
  
  addFileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('file-name').value.trim();
    const submitBtn = addFileForm.querySelector('button[type="submit"]');
    
    if (!name || !currentSubject) return;
    
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
    
    try {
      await apiCall('upload', 'POST', { relativePath: `${currentSubject}/${name}`, content: '' });
      closeModal('add-file-modal');
      addFileForm.reset();
      
      // Reload the current subject
      const subjectBlock = document.querySelector(`.subject-block[data-path="${currentSubject}"]`);
      if (subjectBlock) {
        loadFiles(currentSubject, subjectBlock);
      }
    } catch (error) {
      console.error('Failed to add file:', error);
      alert('Failed to add file: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      submitBtn.style.cursor = '';
    }
  });
  
  // Rename modal
  const renameModal = document.getElementById('rename-modal');
  const renameForm = document.getElementById('rename-form');
  const cancelRenameBtn = document.getElementById('cancel-rename-btn');
  
  cancelRenameBtn.addEventListener('click', () => {
    closeModal('rename-modal');
    renameTarget = null;
  });
  
  renameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('rename-name').value.trim();
    const submitBtn = renameForm.querySelector('button[type="submit"]');
    
    if (!newName || !renameTarget) return;
    
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
    
    try {
      await apiCall('rename', 'POST', { oldPath: renameTarget.path, newName });
      closeModal('rename-modal');
      renameForm.reset();
      renameTarget = null;
      loadSubjects();
    } catch (error) {
      console.error('Failed to rename:', error);
      alert('Failed to rename: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      submitBtn.style.cursor = '';
    }
  });
  
  // Delete modal
  const deleteModal = document.getElementById('delete-modal');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  
  cancelDeleteBtn.addEventListener('click', () => {
    closeModal('delete-modal');
    deleteTarget = null;
  });
  
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!deleteTarget) return;
    
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.style.opacity = '0.5';
    confirmDeleteBtn.style.cursor = 'not-allowed';
    
    try {
      if (deleteTarget.type === 'folder') {
        await apiCall(`folder/${encodeURIComponent(deleteTarget.path)}`, 'DELETE');
      } else {
        await apiCall(`delete/${encodeURIComponent(deleteTarget.path)}`, 'DELETE');
      }
      closeModal('delete-modal');
      deleteTarget = null;
      loadSubjects();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete: ' + error.message);
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.style.opacity = '';
      confirmDeleteBtn.style.cursor = '';
    }
  });
  
  // Close modals on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
        modal.setAttribute('aria-hidden', 'true');
        deleteTarget = null;
        renameTarget = null;
      }
    });
  });
}

// Add file button in subject (shown when a subject is expanded)
function setupAddFileButton() {
  // Modify the homeworks header to show add file button when in a subject
  const homeworksHeader = document.querySelector('.homeworks-header');
  const addSubjectBtn = document.getElementById('add-subject-btn');
  
  // Create add file button (hidden by default)
  const addFileBtn = document.createElement('button');
  addFileBtn.id = 'add-file-btn';
  addFileBtn.className = 'add-btn';
  addFileBtn.type = 'button';
  addFileBtn.setAttribute('aria-label', 'Add file');
  addFileBtn.style.display = 'none';
  addFileBtn.innerHTML = '<span class="add-icon" data-icon="/assets/icons/plus.svg"></span>';
  
  homeworksHeader.appendChild(addFileBtn);
  
  // Load icon for the new button
  const iconSpan = addFileBtn.querySelector('[data-icon]');
  if (iconSpan) {
    fetch(iconSpan.dataset.icon)
      .then(res => res.text())
      .then(svg => iconSpan.innerHTML = svg)
      .catch(err => console.error('Failed to load icon:', err));
  }
  
  // Add file button click handler
  addFileBtn.addEventListener('click', () => {
    if (currentSubject) {
      openModal('add-file-modal');
    }
  });
  
  // Update button visibility based on current state
  function updateAddButton() {
    if (currentSubject) {
      addSubjectBtn.style.display = 'none';
      addFileBtn.style.display = 'grid';
    } else {
      addSubjectBtn.style.display = 'grid';
      addFileBtn.style.display = 'none';
    }
  }
  
  // Expose function to update button state
  window.updateAddButton = updateAddButton;
  
  return { addFileBtn, updateAddButton };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupModals();
  setupAddFileButton();
  
  // Start on AI tab as requested
  // The AI tab is already set as active in HTML
});
