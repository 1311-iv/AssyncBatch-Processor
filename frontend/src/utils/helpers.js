/**
 * Helper Utilities
 * Funciones auxiliares reutilizables
 */

/**
 * Formatear tamaño de archivo en formato legible
 * @param {Number} bytes 
 * @returns {String}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Formatear fecha en formato legible
 * @param {String|Date} date 
 * @returns {String}
 */
export function formatDate(date) {
  const d = new Date(date);
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return d.toLocaleDateString('es-ES', options);
}

/**
 * Formatear tiempo en milisegundos a formato legible
 * @param {Number} ms 
 * @returns {String}
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Generar ID único simple
 * @returns {String}
 */
export function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 * @param {Function} func 
 * @param {Number} delay 
 * @returns {Function}
 */
export function debounce(func, delay = 300) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Truncar texto con ellipsis
 * @param {String} text 
 * @param {Number} maxLength 
 * @returns {String}
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalizar primera letra
 * @param {String} str 
 * @returns {String}
 */
export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Obtener extensión de archivo
 * @param {String} filename 
 * @returns {String}
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot + 1).toLowerCase();
}

/**
 * Copiar texto al clipboard
 * @param {String} text 
 * @returns {Promise<Boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Descargar datos como archivo JSON
 * @param {Object|Array} data 
 * @param {String} filename 
 */
export function downloadAsJSON(data, filename = 'data.json') {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
}

/**
 * Sleep/delay usando Promise
 * @param {Number} ms 
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

