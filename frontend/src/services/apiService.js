
class ApiService {
  constructor() {
    // URL base del backend (ajustar cuando tengas backend corriendo)
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    this.timeout = 30000; // 30 segundos timeout
  }

  async fetchWithTimeout(url, options) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), this.timeout);
    });

    return Promise.race([
      fetch(url, options),
      timeoutPromise
    ]);
  }

  async handleResponse(response) {
    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignorar error de parsing
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  async uploadFiles(files, onProgress = null) {
    let isLoading = true;

    try {
      if (!files || files.length === 0) {
        throw new Error('No files provided for upload');
      }

      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('files', file);
      });

      const options = {
        method: 'POST',
        body: formData,
      };

      const url = `${this.baseURL}/upload`;
      const response = await this.fetchWithTimeout(url, options);

      const data = await this.handleResponse(response);

      if (onProgress && typeof onProgress === 'function') {
        onProgress(100);
      }

      return {
        success: true,
        data: data,
        message: 'Files uploaded successfully'
      };

    } catch (error) {
      console.error('Upload error:', error);

      let errorType = 'UNKNOWN_ERROR';
      let userMessage = 'An unexpected error occurred';

      if (error.message === 'Request timeout') {
        errorType = 'TIMEOUT_ERROR';
        userMessage = 'Upload took too long. Please try again.';
      } else if (error.message.includes('HTTP error')) {
        errorType = 'SERVER_ERROR';
        userMessage = error.message;
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorType = 'NETWORK_ERROR';
        userMessage = 'Network error. Check your connection.';
      }

      return {
        success: false,
        error: errorType,
        message: userMessage,
        details: error.message
      };

    } finally {
      isLoading = false;
      console.log('Upload process completed');
    }
  }

  async getBatchStatus(batchId) {
    try {
      const url = `${this.baseURL}/batch/${batchId}`;
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return await this.handleResponse(response);

    } catch (error) {
      console.error('Error fetching batch status:', error);
      throw error; // Re-lanzar error para que el llamador lo maneje
    }
  }

  async getProcessedFiles(page = 1, limit = 10) {
    try {
      const url = `${this.baseURL}/files?page=${page}&limit=${limit}`;
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return await this.handleResponse(response);

    } catch (error) {
      console.error('Error fetching processed files:', error);
      return {
        success: false,
        data: [],
        message: 'Could not load processed files'
      };
    }
  }

  async downloadReport(fileId) {
    try {
      const url = `${this.baseURL}/files/${fileId}/download`;
      const response = await this.fetchWithTimeout(url, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Convertir respuesta a Blob
      const blob = await response.blob();

      // Crear URL temporal y trigger descarga
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `report_${fileId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar URL temporal
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true };

    } catch (error) {
      console.error('Error downloading report:', error);
      return {
        success: false,
        message: 'Could not download report'
      };
    }
  }

  async pollBatchStatus(batchId, interval = 2000, onUpdate = null) {
    try {
      const status = await this.getBatchStatus(batchId);

      // Callback con actualización
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate(status);
      }

      // Si el batch aún está procesando, hacer polling recursivo
      if (status.processing === true) {
        await new Promise(resolve => setTimeout(resolve, interval));
        return this.pollBatchStatus(batchId, interval, onUpdate);
      }

      // Batch completado
      return status;

    } catch (error) {
      console.error('Error polling batch status:', error);
      throw error;
    }
  }
}

export default new ApiService();
