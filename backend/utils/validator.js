/**
 * Validator Utilities
 * Funciones de validación de datos
 */

/**
 * Validar que un email sea válido
 * @param {String} email 
 * @returns {Boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar que un archivo tenga extensión permitida
 * @param {String} filename 
 * @param {Array} allowedExtensions 
 * @returns {Boolean}
 */
function isValidFileExtension(filename, allowedExtensions = ['.csv', '.json', '.txt']) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

/**
 * Validar tamaño de archivo
 * @param {Number} sizeInBytes 
 * @param {Number} maxSizeInMB 
 * @returns {Boolean}
 */
function isValidFileSize(sizeInBytes, maxSizeInMB = 10) {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
}

/**
 * Validar que un string no esté vacío
 * @param {String} str 
 * @returns {Boolean}
 */
function isNotEmpty(str) {
  return str && typeof str === 'string' && str.trim().length > 0;
}

/**
 * Validar que un valor sea un número positivo
 * @param {*} value 
 * @returns {Boolean}
 */
function isPositiveNumber(value) {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Validar que un objeto tenga todas las propiedades requeridas
 * @param {Object} obj 
 * @param {Array} requiredFields 
 * @returns {Object} { valid: Boolean, missingFields: Array }
 */
function hasRequiredFields(obj, requiredFields) {
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!(field in obj) || obj[field] === null || obj[field] === undefined) {
      missingFields.push(field);
    }
  });
  
  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Sanitizar string para prevenir inyecciones
 * @param {String} str 
 * @returns {String}
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .replace(/[<>]/g, '') // Remover < y >
    .trim();
}

module.exports = {
  isValidEmail,
  isValidFileExtension,
  isValidFileSize,
  isNotEmpty,
  isPositiveNumber,
  hasRequiredFields,
  sanitizeString
};

