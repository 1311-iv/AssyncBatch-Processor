/**
 * ResultsTable Component
 * Muestra resultados finales del procesamiento con sorting y filtering
 * Permite descargar reportes individuales
 */

import apiService from '../services/apiService.js';

export class ResultsTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.results = [];
    this.filteredResults = [];
    this.sortColumn = null;
    this.sortDirection = 'asc'; // 'asc' | 'desc'
    this.editModal = null;
  }

  /**
   * Inicializar tabla con resultados del procesamiento
   * @param {Array} results - Array de resultados del backend
   */
  init(results) {
    this.results = results.map((result, index) => ({
      id: result._id || result.id || index, // Usar _id de MongoDB si está disponible
      _id: result._id || null, // Guardar _id para operaciones CRUD
      filename: result.filename || result.originalName || 'Unknown',
      originalName: result.originalName || result.filename || 'Unknown',
      status: result.status || 'unknown',
      recordsCount: result.recordsCount || 0,
      processingTime: result.processingTime || 0,
      uploadedAt: result.uploadedAt || new Date().toISOString(),
      errorMessage: result.errorMessage || null,
      data: result.data || null
    }));

    this.filteredResults = [...this.results];
    this.render();
    this.show();
  }

  render() {
    const stats = this.calculateStats();

    this.container.innerHTML = `
      <div class="card-body">
        <!-- Header con estadísticas -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="card-title mb-0">Resultados del Procesamiento</h5>
          <div>
            <span class="badge bg-success me-2">
              <i class="bi bi-check-circle"></i> ${stats.completed} Exitosos
            </span>
            <span class="badge bg-danger">
              <i class="bi bi-x-circle"></i> ${stats.failed} Fallidos
            </span>
          </div>
        </div>

        <!-- Métricas generales -->
        <div class="row mb-3">
          <div class="col-md-3">
            <div class="text-center p-3 bg-light rounded">
              <div class="h3 mb-0">${stats.totalFiles}</div>
              <small class="text-muted">Archivos Totales</small>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center p-3 bg-light rounded">
              <div class="h3 mb-0">${stats.totalRecords}</div>
              <small class="text-muted">Registros Procesados</small>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center p-3 bg-light rounded">
              <div class="h3 mb-0">${stats.avgProcessingTime}ms</div>
              <small class="text-muted">Tiempo Promedio</small>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center p-3 bg-light rounded">
              <div class="h3 mb-0">${stats.successRate}%</div>
              <small class="text-muted">Tasa de Éxito</small>
            </div>
          </div>
        </div>

        <!-- Filtro de búsqueda -->
        <div class="mb-3">
          <input 
            type="text" 
            id="search-input" 
            class="form-control" 
            placeholder="🔍 Buscar por nombre de archivo..."
          >
        </div>

        <!-- Tabla de resultados -->
        <div class="table-responsive">
          <table class="table table-hover table-striped align-middle">
            <thead class="table-dark">
              <tr>
                <th class="sortable" data-column="filename">
                  Nombre de Archivo 
                  <i class="bi bi-arrow-down-up"></i>
                </th>
                <th class="sortable text-center" data-column="status">
                  Estado 
                  <i class="bi bi-arrow-down-up"></i>
                </th>
                <th class="sortable text-center" data-column="recordsCount">
                  Registros 
                  <i class="bi bi-arrow-down-up"></i>
                </th>
                <th class="sortable text-center" data-column="processingTime">
                  Tiempo (ms) 
                  <i class="bi bi-arrow-down-up"></i>
                </th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody id="results-tbody">
              ${this.renderTableRows()}
            </tbody>
          </table>
        </div>

        <!-- Exportar todo -->
        <div class="text-center mt-3">
          <button id="export-all-btn" class="btn btn-success">
            <i class="bi bi-download"></i> Exportar Todos los Resultados (JSON)
          </button>
        </div>
      </div>

      <!-- Modal de edición -->
      <div class="modal fade" id="editModal" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="editModalLabel">Editar Archivo</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="edit-form">
                <div class="mb-3">
                  <label for="edit-filename" class="form-label">Nombre de Archivo</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="edit-filename" 
                    required
                  >
                </div>
                <div class="mb-3">
                  <label for="edit-recordsCount" class="form-label">Cantidad de Registros</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="edit-recordsCount" 
                    min="0"
                    required
                  >
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" id="save-edit-btn">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderTableRows() {
    if (this.filteredResults.length === 0) {
      return `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            No se encontraron resultados
          </td>
        </tr>
      `;
    }

    return this.filteredResults.map(result => {
      const statusBadge = result.status === 'completed' 
        ? '<span class="badge bg-success">✓ Completado</span>'
        : '<span class="badge bg-danger">✗ Fallido</span>';

      const hasId = result._id || result.id;

      return `
        <tr>
          <td>
            <i class="bi bi-file-earmark-text text-primary me-2"></i>
            ${result.filename}
          </td>
          <td class="text-center">
            ${statusBadge}
          </td>
          <td class="text-center">
            ${result.status === 'completed' ? result.recordsCount : '-'}
          </td>
          <td class="text-center">
            ${result.processingTime}
          </td>
          <td class="text-center">
            <div class="btn-group" role="group">
              ${result.status === 'completed' 
                ? `<button class="btn btn-sm btn-outline-primary download-btn" data-id="${result.id}">
                     <i class="bi bi-download"></i> Descargar
                   </button>`
                : `<button class="btn btn-sm btn-outline-secondary" disabled title="${result.errorMessage}">
                     <i class="bi bi-info-circle"></i> Ver Error
                   </button>`
              }
              ${hasId ? `
                <button class="btn btn-sm btn-outline-warning edit-btn" data-id="${result._id || result.id}">
                  <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${result._id || result.id}">
                  <i class="bi bi-trash"></i> Eliminar
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  attachEventListeners() {
    // Búsqueda/filtrado
    const searchInput = this.container.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('keyup', (e) => {
        this.filterResults(e.target.value);
      });
    }

    // Sorting por columna
    const sortableHeaders = this.container.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        const column = e.currentTarget.dataset.column;
        this.sortResults(column);
      });
    });

    // Botones de descarga individual
    const downloadButtons = this.container.querySelectorAll('.download-btn');
    downloadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const resultId = parseInt(e.currentTarget.dataset.id);
        this.downloadResult(resultId);
      });
    });

    // Botones de edición
    const editButtons = this.container.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileId = e.currentTarget.dataset.id;
        this.editResult(fileId);
      });
    });

    // Botones de eliminación
    const deleteButtons = this.container.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileId = e.currentTarget.dataset.id;
        this.deleteResult(fileId);
      });
    });

    // Botón guardar edición
    const saveEditBtn = this.container.querySelector('#save-edit-btn');
    if (saveEditBtn) {
      saveEditBtn.addEventListener('click', () => {
        this.saveEdit();
      });
    }

    // Exportar todos
    const exportAllBtn = this.container.querySelector('#export-all-btn');
    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', () => {
        this.exportAllResults();
      });
    }
  }

  /**
   * Filtrar resultados por término de búsqueda
   */
  filterResults(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
      this.filteredResults = [...this.results];
    } else {
      this.filteredResults = this.results.filter(result => 
        result.filename.toLowerCase().includes(term)
      );
    }

    this.updateTableBody();
  }

  /**
   * Ordenar resultados por columna
   */
  sortResults(column) {
    // Toggle dirección si es la misma columna
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredResults.sort((a, b) => {
      let valueA = a[column];
      let valueB = b[column];

      // Manejar strings
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.updateTableBody();
  }

  /**
   * Actualizar solo el tbody sin re-renderizar todo
   */
  updateTableBody() {
    const tbody = this.container.querySelector('#results-tbody');
    tbody.innerHTML = this.renderTableRows();

    // Re-attachar listeners de botones de descarga
    const downloadButtons = tbody.querySelectorAll('.download-btn');
    downloadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const resultId = parseInt(e.currentTarget.dataset.id);
        this.downloadResult(resultId);
      });
    });

    // Re-attachar listeners de botones de edición
    const editButtons = tbody.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileId = e.currentTarget.dataset.id;
        this.editResult(fileId);
      });
    });

    // Re-attachar listeners de botones de eliminación
    const deleteButtons = tbody.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileId = e.currentTarget.dataset.id;
        this.deleteResult(fileId);
      });
    });
  }

  /**
   * Descargar resultado individual
   */
  downloadResult(resultId) {
    const result = this.results.find(r => r.id === resultId);
    if (!result || !result.data) {
      alert('No hay datos para descargar');
      return;
    }

    // Crear Blob con datos JSON
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    // Crear link temporal y descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.filename}_processed.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Feedback visual
    this.showNotification(`Descargando ${result.filename}...`, 'success');
  }

  /**
   * Eliminar resultado
   */
  async deleteResult(fileId) {
    if (!confirm('¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await apiService.deleteFile(fileId);

      if (response.success) {
        // Eliminar de arrays
        this.results = this.results.filter(r => (r._id || r.id) !== fileId);
        this.filteredResults = this.filteredResults.filter(r => (r._id || r.id) !== fileId);

        // Actualizar tabla
        this.updateTableBody();

        this.showNotification(response.message || 'Archivo eliminado exitosamente', 'success');
      } else {
        this.showNotification(response.message || 'Error al eliminar archivo', 'error');
      }
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      this.showNotification('Error al eliminar archivo', 'error');
    }
  }

  /**
   * Editar resultado - abrir modal
   */
  editResult(fileId) {
    const result = this.results.find(r => (r._id || r.id) === fileId);
    if (!result) {
      this.showNotification('Archivo no encontrado', 'error');
      return;
    }

    // Pre-llenar inputs del modal
    const filenameInput = document.getElementById('edit-filename');
    const recordsCountInput = document.getElementById('edit-recordsCount');

    if (filenameInput) {
      filenameInput.value = result.originalName || result.filename;
    }
    if (recordsCountInput) {
      recordsCountInput.value = result.recordsCount || 0;
    }

    // Guardar fileId en el modal para usarlo al guardar
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.dataset.fileId = fileId;
    }

    // Abrir modal con Bootstrap
    if (!this.editModal) {
      this.editModal = new bootstrap.Modal(document.getElementById('editModal'));
    }
    this.editModal.show();
  }

  /**
   * Guardar edición
   */
  async saveEdit() {
    const modal = document.getElementById('editModal');
    if (!modal) {
      return;
    }

    const fileId = modal.dataset.fileId;
    if (!fileId) {
      this.showNotification('Error: ID de archivo no encontrado', 'error');
      return;
    }

    const filenameInput = document.getElementById('edit-filename');
    const recordsCountInput = document.getElementById('edit-recordsCount');

    if (!filenameInput || !recordsCountInput) {
      this.showNotification('Error: Campos del formulario no encontrados', 'error');
      return;
    }

    const originalName = filenameInput.value.trim();
    const recordsCount = parseInt(recordsCountInput.value);

    if (!originalName) {
      this.showNotification('El nombre de archivo es requerido', 'error');
      return;
    }

    if (isNaN(recordsCount) || recordsCount < 0) {
      this.showNotification('La cantidad de registros debe ser un número válido', 'error');
      return;
    }

    try {
      const updates = {
        originalName,
        recordsCount
      };

      const response = await apiService.updateFile(fileId, updates);

      if (response.success) {
        // Actualizar en arrays
        const resultIndex = this.results.findIndex(r => (r._id || r.id) === fileId);
        if (resultIndex !== -1) {
          this.results[resultIndex].originalName = originalName;
          this.results[resultIndex].filename = originalName;
          this.results[resultIndex].recordsCount = recordsCount;
        }

        const filteredIndex = this.filteredResults.findIndex(r => (r._id || r.id) === fileId);
        if (filteredIndex !== -1) {
          this.filteredResults[filteredIndex].originalName = originalName;
          this.filteredResults[filteredIndex].filename = originalName;
          this.filteredResults[filteredIndex].recordsCount = recordsCount;
        }

        // Actualizar tabla
        this.updateTableBody();

        // Cerrar modal
        if (this.editModal) {
          this.editModal.hide();
        }

        this.showNotification(response.message || 'Archivo actualizado exitosamente', 'success');
      } else {
        this.showNotification(response.message || 'Error al actualizar archivo', 'error');
      }
    } catch (error) {
      console.error('Error actualizando archivo:', error);
      this.showNotification('Error al actualizar archivo', 'error');
    }
  }

  /**
   * Exportar todos los resultados
   */
  exportAllResults() {
    const dataStr = JSON.stringify(this.results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_results_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    this.showNotification('Todos los resultados exportados exitosamente', 'success');
  }

  /**
   * Calcular estadísticas de los resultados
   */
  calculateStats() {
    const totalFiles = this.results.length;
    const completed = this.results.filter(r => r.status === 'completed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const totalRecords = this.results.reduce((sum, r) => sum + r.recordsCount, 0);
    const avgProcessingTime = totalFiles > 0 
      ? Math.round(this.results.reduce((sum, r) => sum + r.processingTime, 0) / totalFiles)
      : 0;
    const successRate = totalFiles > 0 
      ? Math.round((completed / totalFiles) * 100)
      : 0;

    return {
      totalFiles,
      completed,
      failed,
      totalRecords,
      avgProcessingTime,
      successRate
    };
  }

  showNotification(message, type = 'info') {
    // Implementar sistema de notificaciones (Bootstrap Toast o custom)
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Puedes mejorar esto con Bootstrap Toasts
    alert(message);
  }

  show() {
    this.container.classList.remove('d-none');
  }

  hide() {
    this.container.classList.add('d-none');
  }

  reset() {
    this.results = [];
    this.filteredResults = [];
    this.hide();
  }
}
