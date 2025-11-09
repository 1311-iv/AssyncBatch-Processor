/**
 * ProgressTracker Component
 * Tracking en tiempo real del estado de procesamiento de cada archivo
 * Demuestra actualización de UI basada en estados de Promises
 */

export class ProgressTracker {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.completedCount = 0;
  }

  /**
   * Inicializar tracking con lista de archivos
   * @param {File[]} files - Archivos a trackear
   */
  init(files) {
    this.files = files.map((file, index) => ({
      id: index,
      name: file.name,
      size: file.size,
      status: 'pending', // pending | processing | completed | failed
      progress: 0,
      message: 'Esperando...',
      error: null
    }));

    this.completedCount = 0;
    this.render();
    this.show();
  }

  render() {
    const totalFiles = this.files.length;
    const progressPercentage = Math.round((this.completedCount / totalFiles) * 100);

    this.container.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">
          Procesamiento en Curso
          <span class="badge bg-primary">${this.completedCount}/${totalFiles}</span>
        </h5>

        <!-- Overall Progress Bar -->
        <div class="mb-4">
          <div class="d-flex justify-content-between mb-2">
            <span>Progreso General</span>
            <span>${progressPercentage}%</span>
          </div>
          <div class="progress" style="height: 25px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                 role="progressbar" 
                 style="width: ${progressPercentage}%"
                 aria-valuenow="${progressPercentage}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
              ${progressPercentage}%
            </div>
          </div>
        </div>

        <!-- Individual File Progress -->
        <div id="files-progress">
          ${this.files.map(file => this.renderFileProgress(file)).join('')}
        </div>
      </div>
    `;
  }

  renderFileProgress(file) {
    const statusBadges = {
      pending: '<span class="status-badge status-pending">Pendiente</span>',
      processing: '<span class="status-badge status-processing processing-animation">Procesando...</span>',
      completed: '<span class="status-badge status-completed">✓ Completado</span>',
      failed: '<span class="status-badge status-failed">✗ Error</span>'
    };

    const statusIcons = {
      pending: 'bi-clock',
      processing: 'bi-arrow-repeat',
      completed: 'bi-check-circle-fill',
      failed: 'bi-x-circle-fill'
    };

    return `
      <div class="progress-item" data-file-id="${file.id}">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center flex-grow-1">
            <i class="bi ${statusIcons[file.status]} fs-4 me-3 
               ${file.status === 'completed' ? 'text-success' : ''}
               ${file.status === 'failed' ? 'text-danger' : ''}
               ${file.status === 'processing' ? 'text-info' : ''}"></i>
            <div class="flex-grow-1">
              <div class="fw-bold">${file.name}</div>
              <small class="text-muted">${this.formatFileSize(file.size)} - ${file.message}</small>
              ${file.error ? `<div class="text-danger small mt-1">${file.error}</div>` : ''}
            </div>
          </div>
          <div class="ms-3">
            ${statusBadges[file.status]}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Actualizar estado de un archivo específico
   * @param {Number} fileId - ID del archivo
   * @param {String} status - Nuevo estado
   * @param {String} message - Mensaje de estado
   * @param {String} error - Mensaje de error (opcional)
   */
  updateFileStatus(fileId, status, message = '', error = null) {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return;

    file.status = status;
    file.message = message;
    file.error = error;

    // Incrementar contador si completó (éxito o error)
    if ((status === 'completed' || status === 'failed') && file.progress < 100) {
      file.progress = 100;
      this.completedCount++;
    }

    // Re-renderizar
    this.render();
  }

  /**
   * Marcar archivo como procesando
   */
  markAsProcessing(fileId) {
    this.updateFileStatus(fileId, 'processing', 'Validando y parseando datos...');
  }

  /**
   * Marcar archivo como completado exitosamente
   */
  markAsCompleted(fileId, recordsCount = 0) {
    this.updateFileStatus(
      fileId, 
      'completed', 
      `Procesado exitosamente (${recordsCount} registros)`
    );
  }

  /**
   * Marcar archivo como fallido
   */
  markAsFailed(fileId, errorMessage) {
    this.updateFileStatus(
      fileId, 
      'failed', 
      'Procesamiento fallido', 
      errorMessage
    );
  }

  /**
   * Verificar si todos los archivos terminaron de procesar
   */
  isComplete() {
    return this.completedCount === this.files.length;
  }

  /**
   * Obtener estadísticas del procesamiento
   */
  getStats() {
    return {
      total: this.files.length,
      completed: this.files.filter(f => f.status === 'completed').length,
      failed: this.files.filter(f => f.status === 'failed').length,
      pending: this.files.filter(f => f.status === 'pending').length,
      processing: this.files.filter(f => f.status === 'processing').length
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  show() {
    this.container.classList.remove('d-none');
  }

  hide() {
    this.container.classList.add('d-none');
  }

  reset() {
    this.files = [];
    this.completedCount = 0;
    this.hide();
  }
}
