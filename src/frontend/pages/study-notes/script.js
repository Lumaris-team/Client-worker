import { loadIcons } from '/lib/icons.js';

// API base URL
const API_BASE = '/api/study-notes';

// State
let currentPath = '';
let currentSubject = null;
let deleteTarget = null;
let renameTarget = null;
let cachedSubjects = [];
let cachedFiles = {}; // Cache files by subject path: { 'maths': { files: [...], timestamp: ... } }
let subjectsLoading = false;

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
  if (subjectsLoading) {
    console.log('study-notes: loadSubjects already in progress, skipping');
    return;
  }

  const subjectsList = document.getElementById('subjects-list');
  if (!subjectsList) {
    console.error('subjects-list element not found!');
    return;
  }

  subjectsLoading = true;
  const previousHTML = subjectsList.innerHTML;
  const hadSubjects = subjectsList.querySelector('.subject-block') !== null;

  subjectsList.innerHTML = `
    <div class="empty-state loading">
      <p class="empty-state-text">Loading subjects...</p>
    </div>
  `;

  console.log('study-notes: loading subjects');

  try {
    const data = await apiCall('', 'GET');

    // Cache subjects for dropdown
    cachedSubjects = data.folders || [];

    renderSubjects(cachedSubjects);
  } catch (error) {
    console.error('Failed to load subjects:', error);
    if (hadSubjects) {
      subjectsList.innerHTML = previousHTML;
    } else {
      subjectsList.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-text">Failed to load subjects</p>
          <p class="empty-state-subtext">${error.message}</p>
        </div>
      `;
    }
  } finally {
    subjectsLoading = false;
  }
}

// Render subjects to the DOM (simple full rebuild)
function renderSubjects(subjects) {
  const subjectsList = document.getElementById('subjects-list');
  if (!subjectsList) return;

  if (!subjects || subjects.length === 0) {
    subjectsList.innerHTML = `
      <div class="empty-state">
        <p class="empty-state-text">No subjects yet</p>
        <p class="empty-state-subtext">Create a subject to get started</p>
      </div>
    `;
    return;
  }

  const html = subjects.map(subject => `
    <div class="subject-block" data-path="${subject.path}" data-name="${subject.name}">
      <div class="subject-header">
        <div class="subject-info">
          <span class="subject-icon" data-icon="/assets/icons/subjects.svg"></span>
          <div class="subject-meta">
            <h3 class="subject-name">${subject.name}</h3>
            <p class="subject-count">0 files</p>
          </div>
        </div>
        <div class="subject-actions">
          <button class="subject-action-btn rename" aria-label="Rename">
            <span data-icon="/assets/icons/edit.svg"></span>
          </button>
          <button class="subject-action-btn delete" aria-label="Delete">
            <span data-icon="/assets/icons/delete.svg"></span>
          </button>
        </div>
      </div>
      <div class="subject-content" data-expanded="false">
        <div class="files-list" data-loading="false">
        </div>
      </div>
    </div>
  `).join('');

  subjectsList.innerHTML = html;

  attachSubjectListeners();

  // Load icons using shared function
  loadIcons(subjectsList);

  // Preload all files in background
  preloadAllFiles();
}

function updateSubjectCount(subjectPath, files) {
  const subjectBlocks = document.querySelectorAll('.subject-block');
  subjectBlocks.forEach((block) => {
    if (block.dataset.path !== subjectPath) return;
    const subjectCount = block.querySelector('.subject-count');
    if (!subjectCount) return;
    subjectCount.textContent = `${files.length} file${files.length > 1 ? 's' : ''}`;
  });
}

// Preload all files from all subjects
async function preloadAllFiles() {
  console.log('Preloading all files from all subjects...');
  const subjects = cachedSubjects || [];

  for (const subject of subjects) {
    try {
      await loadFilesSilent(subject.path);
    } catch (error) {
      console.error(`Failed to preload files for ${subject.path}:`, error);
    }
  }

  console.log('All files preloaded');
}

// Load files silently (for background caching)
async function loadFilesSilent(subjectPath) {
  try {
    const data = await apiCall(`list/${encodeURIComponent(subjectPath)}`, 'GET');
    const files = data.files || [];
    cachedFiles[subjectPath] = {
      files,
      timestamp: Date.now()
    };
    updateSubjectCount(subjectPath, files);
    console.log(`Cached ${files.length} files for ${subjectPath}`);
  } catch (error) {
    console.error(`Failed to load files silently for ${subjectPath}:`, error);
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
    filesList.innerHTML = `
      <div class="empty-state loading">
        <p class="empty-state-text">Loading files...</p>
      </div>
    `;

    console.log('study-notes: loading files for subject', subjectPath);

    // Use cached files if available
    const cached = cachedFiles[subjectPath];
    if (cached && cached.files) {
      renderFiles(cached.files, filesList, subjectCount);
      attachFileListeners(subjectBlock);
      await loadIcons(filesList);
    }

    // Refresh silently in background
    const data = await apiCall(`list/${encodeURIComponent(subjectPath)}`, 'GET');
    const freshFiles = data.files || [];
    cachedFiles[subjectPath] = {
      files: freshFiles,
      timestamp: Date.now()
    };
    updateSubjectCount(subjectPath, freshFiles);

    // Re-render if data changed
    if (!cached || JSON.stringify(cached.files) !== JSON.stringify(freshFiles)) {
      renderFiles(freshFiles, filesList, subjectCount);
      attachFileListeners(subjectBlock);
      await loadIcons(filesList);
    }
  } catch (error) {
    console.error('Failed to load files:', error);
    const cached = cachedFiles[subjectPath];
    if (!cached || !cached.files || cached.files.length === 0) {
      filesList.innerHTML = `
        <div class="empty-state" style="padding: 30px 20px; border: none;">
          <p class="empty-state-text" style="font-size: 0.95rem;">Failed to load files</p>
        </div>
      `;
    }
  } finally {
    // Only set loading to false if the subject is still expanded
    const content = subjectBlock.querySelector('.subject-content');
    if (content && content.dataset.expanded === 'true') {
      filesList.dataset.loading = 'false';
    }
  }
}

// Render files to the DOM
function renderFiles(files, filesList, subjectCount) {
  if (!files || files.length === 0) {
    filesList.innerHTML = `
      <div class="empty-state" style="padding: 30px 20px; border: none;">
        <p class="empty-state-text" style="font-size: 0.95rem;">No files in this subject</p>
      </div>
    `;
    if (subjectCount) {
      subjectCount.textContent = 'No files';
    }
    return;
  }

  if (subjectCount) {
    subjectCount.textContent = `${files.length} file${files.length > 1 ? 's' : ''}`;
  }

  filesList.innerHTML = files.map(file => `
    <div class="file-block" data-path="${file.path}" data-name="${file.name}">
      <div class="file-icon" data-icon="/assets/icons/file.svg"></div>
      <h4 class="file-name">${file.name}</h4>
      <div class="file-actions">
        <button class="file-action-btn download" type="button" aria-label="Download file">
          <span data-icon="/assets/icons/download.svg"></span>
        </button>
        <button class="file-action-btn rename" type="button" aria-label="Rename file">
          <span data-icon="/assets/icons/edit.svg"></span>
        </button>
        <button class="file-action-btn delete" type="button" aria-label="Delete file">
          <span data-icon="/assets/icons/delete.svg"></span>
        </button>
      </div>
    </div>
  `).join('');
}

// Attach event listeners to subject blocks
function attachSubjectListeners() {
  const subjectBlocks = document.querySelectorAll('.subject-block');

  if (subjectBlocks.length === 0) {
    return;
  }

  subjectBlocks.forEach((block) => {
    const path = block.dataset.path;
    const name = block.dataset.name;
    const content = block.querySelector('.subject-content');
    const filesList = block.querySelector('.files-list');

    // Click on subject block to expand/collapse
    block.addEventListener('click', (e) => {
      if (e.target.closest('.subject-action-btn')) {
        return;
      }

      console.log('study-notes: subject clicked', { path, name, target: e.target.tagName });

      const isExpanded = content.dataset.expanded === 'true';
      const isLoading = filesList.dataset.loading === 'true';

      if (!isExpanded && !isLoading) {
        content.dataset.expanded = 'true';
        filesList.dataset.loading = 'true';
        loadFiles(path, block);
      } else if (isExpanded) {
        content.dataset.expanded = 'false';
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

    // Download button
    const downloadBtn = block.querySelector('.file-action-btn.download');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          // Get MEGA URL from backend
          const data = await apiCall(`read/${encodeURIComponent(path)}`, 'GET');

          if (!data.success || !data.url) {
            throw new Error('Failed to get download URL');
          }

          // Use megajs in browser to download directly from MEGA
          const megaFile = await window.mega.File.fromURL(data.url);
          await megaFile.loadAttributes();

          const buffer = await megaFile.downloadBuffer();
          const blob = new Blob([buffer]);

          // Create a temporary link to trigger download
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = data.name || name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        } catch (error) {
          console.error('Failed to download file:', error);
          alert('Failed to download file: ' + error.message);
        }
      });
    }

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
  const noteTakingTabBtn = document.getElementById('note-taking-tab-btn');
  const aiTab = document.getElementById('ai-tab');
  const homeworksTab = document.getElementById('homeworks-tab');
  const noteTakingTab = document.getElementById('note-taking-tab');

  homeworksTabBtn.addEventListener('click', () => {
    homeworksTabBtn.dataset.active = 'true';
    aiTabBtn.dataset.active = 'false';
    noteTakingTabBtn.dataset.active = 'false';
    homeworksTab.dataset.active = 'true';
    aiTab.dataset.active = 'false';
    noteTakingTab.dataset.active = 'false';
    loadSubjects();
  });

  noteTakingTabBtn.addEventListener('click', () => {
    noteTakingTabBtn.dataset.active = 'true';
    homeworksTabBtn.dataset.active = 'false';
    aiTabBtn.dataset.active = 'false';
    noteTakingTab.dataset.active = 'true';
    homeworksTab.dataset.active = 'false';
    aiTab.dataset.active = 'false';
  });

  aiTabBtn.addEventListener('click', () => {
    aiTabBtn.dataset.active = 'true';
    homeworksTabBtn.dataset.active = 'false';
    noteTakingTabBtn.dataset.active = 'false';
    aiTab.dataset.active = 'true';
    homeworksTab.dataset.active = 'false';
    noteTakingTab.dataset.active = 'false';
  });
}

// Modal helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  console.log('Opening modal:', modalId, modal);
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.setAttribute('aria-hidden', 'true');
}

// Note taking functionality
function setupNoteTaking() {
  const noteEditor = document.getElementById('note-editor');
  const importNoteBtn = document.getElementById('import-note-btn');
  const downloadNoteBtn = document.getElementById('download-note-btn');
  const saveNoteBtn = document.getElementById('save-note-btn');
  const saveNoteModal = document.getElementById('save-note-modal');
  const cancelSaveNoteBtn = document.getElementById('cancel-save-note-btn');
  const saveNoteForm = document.getElementById('save-note-form');
  const noteSubjectSelect = document.getElementById('note-subject-select');

  // Auto bullet point on new line
  noteEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const start = noteEditor.selectionStart;
      const end = noteEditor.selectionEnd;
      const value = noteEditor.value;

      // Insert new line with bullet point
      const newValue = value.substring(0, start) + '\n - ' + value.substring(end);
      noteEditor.value = newValue;

      // Move cursor after the bullet point
      const newCursorPos = start + 4;
      noteEditor.setSelectionRange(newCursorPos, newCursorPos);
    }
  });

  // Import txt file
  importNoteBtn.addEventListener('click', () => {
    importNoteBtn.disabled = true;
    importNoteBtn.style.opacity = '0.5';
    importNoteBtn.style.cursor = 'not-allowed';

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          noteEditor.value = e.target.result;
          importNoteBtn.disabled = false;
          importNoteBtn.style.opacity = '';
          importNoteBtn.style.cursor = '';
        };
        reader.readAsText(file);
      } else {
        importNoteBtn.disabled = false;
        importNoteBtn.style.opacity = '';
        importNoteBtn.style.cursor = '';
      }
    };
    input.click();
  });

  // Download to device
  downloadNoteBtn.addEventListener('click', () => {
    downloadNoteBtn.disabled = true;
    downloadNoteBtn.style.opacity = '0.5';
    downloadNoteBtn.style.cursor = 'not-allowed';

    const content = noteEditor.value;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'note.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      downloadNoteBtn.disabled = false;
      downloadNoteBtn.style.opacity = '';
      downloadNoteBtn.style.cursor = '';
    }, 500);
  });

  // Save to cloud modal
  saveNoteBtn.addEventListener('click', () => {
    // Populate subject select
    noteSubjectSelect.innerHTML = cachedSubjects.map(subject =>
      `<option value="${subject.path}">${subject.name}</option>`
    ).join('');
    openModal('save-note-modal');
  });

  cancelSaveNoteBtn.addEventListener('click', () => {
    closeModal('save-note-modal');
  });

  // Save note form submission
  saveNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = saveNoteForm.querySelector('button[type="submit"]');
    const subject = noteSubjectSelect.value;
    const filename = document.getElementById('note-filename').value + '.txt';
    const content = noteEditor.value;

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';

    try {
      const formData = new FormData();
      formData.append('file', new Blob([content], { type: 'text/plain' }), filename);
      formData.append('relativePath', `${subject}/${filename}`);

      await apiCall('upload', 'POST', formData);
      closeModal('save-note-modal');
      noteEditor.value = '';
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      submitBtn.style.cursor = '';
    }
  });
}

// Setup modals
function setupModals() {
  // Add subject modal
  const addSubjectModal = document.getElementById('add-subject-modal');
  const addSubjectForm = document.getElementById('add-subject-form');
  const cancelAddSubjectBtn = document.getElementById('cancel-add-subject-btn');

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
      // Refresh subjects list and cache
      await loadSubjects();
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

  // Load subjects when modal is opened (uses cache, refreshes in background)
  const loadSubjectsForDropdown = async () => {
    const subjectSelect = document.getElementById('subject-select');

    // Use cached subjects immediately
    subjectSelect.innerHTML = '<option value="">Select a subject</option>';
    if (cachedSubjects && cachedSubjects.length > 0) {
      cachedSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.name;
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
      });
    } else {
      subjectSelect.innerHTML = '<option value="">No subjects available</option>';
    }

    // Refresh cache in background
    try {
      const data = await apiCall('', 'GET');
      cachedSubjects = data.folders || [];

      // Update dropdown with fresh data
      subjectSelect.innerHTML = '<option value="">Select a subject</option>';
      if (cachedSubjects.length > 0) {
        cachedSubjects.forEach(subject => {
          const option = document.createElement('option');
          option.value = subject.name;
          option.textContent = subject.name;
          subjectSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Failed to refresh subjects:', error);
    }
  };

  // Override openModal for add-file-modal to load subjects
  const originalOpenModal = openModal;
  openModal = (modalId) => {
    if (modalId === 'add-file-modal') {
      loadSubjectsForDropdown();
    }
    originalOpenModal(modalId);
  };
  
  addFileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject = document.getElementById('subject-select').value;
    const fileInput = document.getElementById('file-input');
    const submitBtn = addFileForm.querySelector('button[type="submit"]');

    // Validation: prevent upload without subject selection
    if (!subject) {
      alert('Please select a subject before uploading');
      return;
    }

    if (!fileInput.files[0]) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    // Include filename in the path: "subject/filename.ext"
    formData.append('relativePath', `${subject}/${fileInput.files[0].name}`);

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';

    try {
      await apiCall('upload', 'POST', formData);
      closeModal('add-file-modal');
      addFileForm.reset();

      // Reload the subjects list and cache
      await loadSubjects();
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file: ' + error.message);
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
  const uploadBtn = document.getElementById('upload-btn');
  const folderBtn = document.getElementById('folder-btn');

  console.log('Setting up sidebar buttons:', { uploadBtn, folderBtn });

  // Upload button click handler
  uploadBtn.addEventListener('click', () => {
    console.log('Upload button clicked');
    openModal('add-file-modal');
  });

  // Folder button click handler - always opens modal to add to root
  folderBtn.addEventListener('click', () => {
    console.log('Folder button clicked');
    openModal('add-subject-modal');
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupModals();
  setupAddFileButton();
  setupNoteTaking();

  // Load subjects on page load
  loadSubjects();

  // Start on homeworks tab as requested
  // The homeworks tab is already set as active in HTML
});
