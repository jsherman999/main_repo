// App State
let currentFile = null;
let activeServers = {}; // Track active artifact servers

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewArea = document.getElementById('preview-area');
const previewImage = document.getElementById('preview-image');
const previewFilename = document.getElementById('preview-filename');
const previewSize = document.getElementById('preview-size');
const removeImageBtn = document.getElementById('remove-image');
const uploadForm = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');
const progressSection = document.getElementById('progress-section');
const progressMessage = document.getElementById('progress-message');
const progressBarFill = document.getElementById('progress-bar-fill');
const resultSection = document.getElementById('result-section');
const resultMessage = document.getElementById('result-message');
const downloadLink = document.getElementById('download-link');
const createAnotherBtn = document.getElementById('create-another');
const historyList = document.getElementById('history-list');
const historyCount = document.getElementById('history-count');
const statusIndicator = document.getElementById('status-indicator');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    loadActiveServers();
    loadHistory();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Drag and drop
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // File input
    fileInput.addEventListener('change', handleFileSelect);

    // Remove image
    removeImageBtn.addEventListener('click', removeImage);

    // Form submit
    uploadForm.addEventListener('submit', handleSubmit);

    // Create another
    createAnotherBtn.addEventListener('click', resetForm);
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// File Handling
function handleFile(file) {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        showNotification('Please select a valid image file (PNG, JPG, WEBP, GIF)', 'error');
        return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('File size must be less than 10MB', 'error');
        return;
    }

    currentFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewFilename.textContent = file.name;
        previewSize.textContent = formatFileSize(file.size);

        dropZone.classList.add('hidden');
        previewArea.classList.remove('hidden');
        submitBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    currentFile = null;
    fileInput.value = '';
    previewImage.src = '';
    previewFilename.textContent = '';
    previewSize.textContent = '';

    previewArea.classList.add('hidden');
    dropZone.classList.remove('hidden');
    submitBtn.disabled = true;
}

// Form Submission
async function handleSubmit(e) {
    e.preventDefault();

    if (!currentFile) {
        showNotification('Please select a screenshot', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('screenshot', currentFile);
    formData.append('appName', document.getElementById('app-name').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('vendor', document.getElementById('vendor').value);
    formData.append('links', document.getElementById('links').value);
    formData.append('notes', document.getElementById('notes').value);

    // Show progress
    uploadForm.classList.add('hidden');
    progressSection.classList.remove('hidden');

    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressBarFill.style.width = progress + '%';

        // Update messages
        if (progress < 20) {
            progressMessage.textContent = 'Analyzing screenshot with Vision Agent...';
        } else if (progress < 40) {
            progressMessage.textContent = 'Identifying UI elements and layout...';
        } else if (progress < 60) {
            progressMessage.textContent = 'Generating tooltip content...';
        } else if (progress < 80) {
            progressMessage.textContent = 'Building interactive HTML documentation...';
        } else {
            progressMessage.textContent = 'Validating and packaging files...';
        }
    }, 500);

    try {
        const response = await fetch('/api/process', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        clearInterval(progressInterval);
        progressBarFill.style.width = '100%';

        if (data.success) {
            // Show result
            setTimeout(() => {
                progressSection.classList.add('hidden');
                showResult(data.entry);
                loadHistory(); // Refresh history
            }, 500);
        } else {
            throw new Error(data.error || 'Failed to generate documentation');
        }
    } catch (error) {
        clearInterval(progressInterval);
        progressSection.classList.add('hidden');
        uploadForm.classList.remove('hidden');
        showNotification('Error: ' + error.message, 'error');
    }
}

// Show Result
function showResult(entry) {
    resultSection.classList.remove('hidden');

    resultMessage.textContent = `Documentation package created successfully for ${entry.appName}`;

    // Update stats
    document.getElementById('stat-time').textContent =
        (entry.metadata.processing_time / 1000).toFixed(1) + 's';
    document.getElementById('stat-score').textContent =
        entry.validation.overall_score + '/100';
    document.getElementById('stat-cost').textContent =
        '$' + entry.costEstimate.toFixed(4);

    // Set download link
    downloadLink.href = `/api/download/${entry.outputFilename}`;
    downloadLink.download = entry.outputFilename;
}

// Reset Form
function resetForm() {
    removeImage();
    uploadForm.reset();
    uploadForm.classList.remove('hidden');
    resultSection.classList.add('hidden');
    progressSection.classList.add('hidden');
    progressBarFill.style.width = '0%';
}

// History
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();

        if (data.success) {
            displayHistory(data.history);
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

function displayHistory(history) {
    historyCount.textContent = history.length;

    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No documentation generated yet</p>
                <span>Upload a screenshot to get started!</span>
            </div>
        `;
        return;
    }

    historyList.innerHTML = history.map(entry => `
        <div class="history-item" data-id="${entry.id}">
            <div class="history-item-header">
                <div>
                    <h3>${escapeHtml(entry.appName)}</h3>
                    <div class="history-item-meta">
                        <span>${formatTimestamp(entry.timestamp)}</span>
                        ${entry.vendor ? `<span>${escapeHtml(entry.vendor)}</span>` : ''}
                    </div>
                </div>
            </div>

            ${entry.description ? `
                <div class="history-item-description">
                    ${escapeHtml(entry.description)}
                </div>
            ` : ''}

            <div class="history-item-stats">
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ${(entry.metadata.processing_time / 1000).toFixed(1)}s
                </span>
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ${entry.validation.overall_score}/100
                </span>
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    $${entry.costEstimate.toFixed(4)}
                </span>
            </div>

            ${activeServers[entry.id] ? `
                <div class="server-url">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Serving at: <a href="${activeServers[entry.id].url}" target="_blank" class="server-link">${activeServers[entry.id].url}</a></span>
                </div>
            ` : ''}

            <div class="history-item-actions">
                <a href="/api/download/${entry.outputFilename}" download="${entry.outputFilename}" class="btn-small">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                </a>
                ${activeServers[entry.id] ? `
                    <button onclick="stopServing('${entry.id}')" class="btn-small btn-warning">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Stop
                    </button>
                ` : `
                    <button onclick="startServing('${entry.id}')" class="btn-small btn-success">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        Serve
                    </button>
                `}
                <button onclick="deleteHistoryItem('${entry.id}')" class="btn-small btn-danger">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Delete History Item
async function deleteHistoryItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }

    try {
        const response = await fetch(`/api/history/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Item deleted successfully', 'success');
            await loadActiveServers();
            loadHistory();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showNotification('Failed to delete item: ' + error.message, 'error');
    }
}

// Artifact Server Management

async function loadActiveServers() {
    try {
        const response = await fetch('/api/servers');
        const data = await response.json();

        if (data.success) {
            activeServers = data.servers;
        }
    } catch (error) {
        console.error('Failed to load active servers:', error);
    }
}

async function startServing(id) {
    try {
        const button = event.target.closest('button');
        button.disabled = true;
        button.textContent = 'Starting...';

        const response = await fetch(`/api/serve/${id}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            activeServers[id] = { port: data.port, url: data.url };
            showNotification(`Server started at ${data.url}`, 'success');
            loadHistory();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showNotification('Failed to start server: ' + error.message, 'error');
        loadHistory();
    }
}

async function stopServing(id) {
    try {
        const button = event.target.closest('button');
        button.disabled = true;
        button.textContent = 'Stopping...';

        const response = await fetch(`/api/stop/${id}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            delete activeServers[id];
            showNotification('Server stopped', 'success');
            loadHistory();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showNotification('Failed to stop server: ' + error.message, 'error');
        loadHistory();
    }
}

// Health Check
async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();

        if (data.success && data.apiKeyConfigured) {
            statusIndicator.classList.add('online');
            statusIndicator.querySelector('.status-text').textContent = 'Ready';
        } else {
            statusIndicator.classList.add('offline');
            statusIndicator.querySelector('.status-text').textContent = 'API Key Missing';
            showNotification('Please configure ANTHROPIC_API_KEY in .env file', 'warning');
        }
    } catch (error) {
        statusIndicator.classList.add('offline');
        statusIndicator.querySelector('.status-text').textContent = 'Offline';
    }
}

// Utilities
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Simple notification - could be enhanced with a library
    alert(message);
}

// Make functions available globally
window.deleteHistoryItem = deleteHistoryItem;
window.startServing = startServing;
window.stopServing = stopServing;
