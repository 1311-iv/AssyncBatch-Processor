
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { FileUploader } from './components/FileUploader.js';
import { ProgressTracker } from './components/ProgressTracker.js';
import { ResultsTable } from './components/ResultsTable.js';
import apiService from './services/apiService.js';
import './styles/main.css';

class App {
  constructor() {
    this.fileUploader = null;
    this.progressTracker = null;
    this.resultsTable = null;
    this.isProcessing = false;
    
    this.init();
  }

  init() {
    // Inicializar componentes
    this.fileUploader = new FileUploader('upload-section');
    this.progressTracker = new ProgressTracker('progress-section');
    this.resultsTable = new ResultsTable('results-section');
    
    // Escuchar evento de archivos listos para subir
    document.addEventListener('filesReadyToUpload', (e) => {
      this.handleUpload(e.detail.files);
    });

    console.log('AsyncBatch Processor inicializado');
  }

  async handleUpload(files) {
    if (this.isProcessing) {
      alert('Ya hay un procesamiento en curso. Por favor espera.');
      return;
    }

    this.isProcessing = true;

    // QUÉ HACE: try ejecuta el flujo principal, catch captura cualquier error durante el proceso, finally garantiza limpieza de estado
    // POR QUÉ: Asegura que isProcessing se resetee y el componente se limpie siempre, incluso si falla la subida o el procesamiento
    try {
      this.progressTracker.init(files);
      this.resultsTable.hide();

      await this.simulateLocalValidation(files);

      console.log('Iniciando upload al backend...');
      
      const uploadResponse = await apiService.uploadFiles(files);

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || 'Upload failed');
      }

      console.log('Upload completado:', uploadResponse);

      const backendResults = uploadResponse.data?.data || uploadResponse.data || [];
      const processedResults = await this.processBackendResponse(
        backendResults, 
        files
      );

      this.resultsTable.init(processedResults);

      const stats = this.progressTracker.getStats();
      this.showSuccessNotification(
        `Procesamiento completado: ${stats.completed} exitosos, ${stats.failed} fallidos`
      );

    } catch (error) {
      console.error('Error en el procesamiento:', error);
      this.showErrorNotification(
        `Error: ${error.message}. Por favor intenta nuevamente.`
      );
      
      files.forEach((file, index) => {
        this.progressTracker.markAsFailed(index, error.message);
      });

    } finally {
      this.isProcessing = false;
      this.fileUploader.reset();
    }
  }

  simulateLocalValidation(files) {
    return new Promise((resolve, reject) => {
      console.log('Validando archivos localmente...');

      setTimeout(() => {
        files.forEach((file, index) => {
          this.progressTracker.markAsProcessing(index);
        });
        
        console.log('Validación local completada');
        resolve();
      }, 500);
    });
  }

  async processBackendResponse(backendResults, originalFiles) {
    console.log('Procesando resultados del backend...', backendResults);

    if (!Array.isArray(backendResults)) {
      console.error('backendResults no es un array:', backendResults);
      throw new Error('Formato de respuesta del backend inválido: se esperaba un array');
    }

    const processingPromises = backendResults.map((result, index) => {
      return this.processSingleResult(result, index);
    });

    // QUÉ HACE: Promise.allSettled ejecuta todas las Promises y espera a que todas terminen (exitosas o fallidas), retornando un array con el estado de cada una
    // POR QUÉ: Permite procesar múltiples archivos en paralelo sin que un fallo detenga los demás, obteniendo resultados completos de todos los archivos
    const settledResults = await Promise.allSettled(processingPromises);

    // Mapear resultados settled a formato de tabla
    return settledResults.map((settled, index) => {
      const originalFile = originalFiles[index];

      if (settled.status === 'fulfilled') {
        // Promise exitosa
        const result = settled.value;
        this.progressTracker.markAsCompleted(index, result.recordsCount);
        
        return {
          filename: originalFile.name,
          status: 'completed',
          recordsCount: result.recordsCount,
          processingTime: result.processingTime,
          uploadedAt: new Date().toISOString(),
          errorMessage: null,
          data: result.data
        };
      } else {
        // Promise rechazada
        const error = settled.reason;
        this.progressTracker.markAsFailed(index, error.message);
        
        return {
          filename: originalFile.name,
          status: 'failed',
          recordsCount: 0,
          processingTime: 0,
          uploadedAt: new Date().toISOString(),
          errorMessage: error.message,
          data: null
        };
      }
    });
  }

  processSingleResult(result, index) {
    return new Promise((resolve, reject) => {
      const processingTime = Math.random() * 2000 + 500;

      setTimeout(() => {
        const isSuccess = Math.random() > 0.2;

        if (isSuccess) {
          resolve({
            recordsCount: Math.floor(Math.random() * 1000) + 100,
            processingTime: Math.round(processingTime),
            data: result.data || { sample: 'data' }
          });
        } else {
          reject(new Error('Formato de archivo inválido o datos corruptos'));
        }
      }, processingTime);
    });
  }

  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  showErrorNotification(message) {
    this.showNotification(message, 'danger');
  }

  showNotification(message, type) {
    // Implementación simple con alert (mejorar con Bootstrap Toast)
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-dismiss después de 5 segundos
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }
}

// Inicializar aplicación cuando DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
