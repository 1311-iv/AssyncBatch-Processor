/**
 * ResultsTable Component
 * Muestra resultados finales del procesamiento con sorting y filtering
 * Permite descargar reportes individuales
 */

export class ResultsTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.results = [];
    this.filteredResults = [];
    this.sortColumn = null;
    this.sortDirection = 'asc'; // 'asc' | 'desc'
  }

  /**
   * Inicializar tabla con resultados del procesamiento
   * @param {Array} results - Array de resultados del backend
   */
  init(results) {
    this.results = results.map((result, index) => ({
      id: index,
      filename: result.filename || 'Unknown',
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
            ${result.status === 'completed' 
              ? `<button class="btn btn-sm btn-outline-primary download-btn" data-id="${result.id}">
                   <i class="bi bi-download"></i> Descargar
                 </button>`
              : `<button class="btn btn-sm btn-outline-secondary" disabled title="${result.errorMessage}">
                   <i class="bi bi-info-circle"></i> Ver Error
                 </button>`
            }
          </td>
        </tr>
      `;
    }).join('');
  }

  attachEventListeners() {
    // Búsqueda/filtrado
    const searchInput = this.container.querySelector('#search-input');
    searchInput.addEventListener('keyup', (e) => {
      this.filterResults(e.target.value);
    });

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

    // Exportar todos
    const exportAllBtn = this.container.querySelector('#export-all-btn');
    exportAllBtn.addEventListener('click', () => {
      this.exportAllResults();
    });
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
