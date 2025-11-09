/**
 * FileUploader Component
 * Maneja drag-and-drop y selección de archivos
 * Valida tipos y tamaños antes de procesar
 */

export class FileUploader {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.selectedFiles = [];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = ['text/csv', 'application/json', 'text/plain'];
    
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Subir Archivos</h5>
        
        <!-- Drag and Drop Area -->
        <div id="drop-area" class="drop-area">
          <i class="bi bi-cloud-upload fs-1 text-primary"></i>
          <p class="mt-3">Arrastra archivos aquí o haz clic para seleccionar</p>
          <p class="text-muted small">Formatos: CSV, JSON, TXT | Tamaño máximo: 10MB</p>
          <input type="file" id="file-input" class="d-none" multiple 
                 accept=".csv,.json,.txt">
        </div>

        <!-- Selected Files List -->
        <div id="selected-files" class="mt-3 d-none">
          <h6>Archivos Seleccionados:</h6>
          <ul class="list-group" id="files-list"></ul>
        </div>

        <!-- Upload Button -->
        <div class="mt-3 text-center">
          <button id="upload-btn" class="btn btn-primary btn-lg" disabled>
            <i class="bi bi-upload"></i> Procesar Archivos
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const dropArea = this.container.querySelector('#drop-area');
    const fileInput = this.container.querySelector('#file-input');
    const uploadBtn = this.container.querySelector('#upload-btn');

    // Click en drop area abre file selector
    dropArea.addEventListener('click', () => fileInput.click());

    // Drag and Drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => {
        dropArea.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => {
        dropArea.classList.remove('drag-over');
      });
    });

    // Handle drop
    dropArea.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files);
      this.handleFiles(files);
    });

    // Handle file input change
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      this.handleFiles(files);
    });

    // Handle upload button click
    uploadBtn.addEventListener('click', () => {
      this.onUploadClick();
    });
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleFiles(files) {
    // Validar archivos
    const validFiles = files.filter(file => this.validateFile(file));
    
    if (validFiles.length === 0) {
      this.showAlert('No se seleccionaron archivos válidos', 'danger');
      return;
    }

    this.selectedFiles = validFiles;
    this.displaySelectedFiles();
    this.enableUploadButton();
  }

  validateFile(file) {
    // Validar tipo
    if (!this.allowedTypes.includes(file.type)) {
      this.showAlert(`${file.name}: Tipo de archivo no permitido`, 'warning');
      return false;
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      this.showAlert(`${file.name}: Tamaño excede 10MB`, 'warning');
      return false;
    }

    return true;
  }

  displaySelectedFiles() {
    const filesList = this.container.querySelector('#files-list');
    const selectedFilesDiv = this.container.querySelector('#selected-files');
    
    filesList.innerHTML = '';
    
    this.selectedFiles.forEach((file, index) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <div>
          <i class="bi bi-file-earmark-text text-primary"></i>
          <span class="ms-2">${file.name}</span>
          <span class="text-muted ms-2">(${this.formatFileSize(file.size)})</span>
        </div>
        <button class="btn btn-sm btn-danger" data-index="${index}">
          <i class="bi bi-x"></i>
        </button>
      `;
      
      // Remove file button
      li.querySelector('button').addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        this.removeFile(idx);
      });
      
      filesList.appendChild(li);
    });
    
    selectedFilesDiv.classList.remove('d-none');
  }

  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    
    if (this.selectedFiles.length === 0) {
      this.container.querySelector('#selected-files').classList.add('d-none');
      this.disableUploadButton();
    } else {
      this.displaySelectedFiles();
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  enableUploadButton() {
    this.container.querySelector('#upload-btn').disabled = false;
  }

  disableUploadButton() {
    this.container.querySelector('#upload-btn').disabled = true;
  }

  showAlert(message, type) {
    // Implementar sistema de alertas (puedes usar Bootstrap alerts)
    console.warn(message);
  }

  onUploadClick() {
    // Este método será llamado desde main.js
    // Dispara evento custom que main.js escucha
    const event = new CustomEvent('filesReadyToUpload', {
      detail: { files: this.selectedFiles }
    });
    document.dispatchEvent(event);
  }

  reset() {
    this.selectedFiles = [];
    this.container.querySelector('#selected-files').classList.add('d-none');
    this.container.querySelector('#file-input').value = '';
    this.disableUploadButton();
  }
}
