/**
 * Validators Utilities
 * Validaciones del lado del cliente
 */

/**
 * Validar tipo de archivo
 * @param {File} file 
 * @param {Array} allowedTypes 
 * @returns {Object} { valid: Boolean, error: String }
 */
export function validateFileType(file, allowedTypes = ['text/csv', 'application/json', 'text/plain']) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Tipo de archivo no permitido: ${file.type}. Permitidos: CSV, JSON, TXT` 
    };
  }
  
  return { valid: true, error: null };
}

/**
 * Validar tamaño de archivo
 * @param {File} file 
 * @param {Number} maxSizeMB 
 * @returns {Object} { valid: Boolean, error: String }
 */
export function validateFileSize(file, maxSizeMB = 10) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo: ${maxSizeMB}MB` 
    };
  }
  
  if (file.size === 0) {
    return { valid: false, error: 'El archivo está vacío' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validar archivo completo (tipo + tamaño)
 * @param {File} file 
 * @param {Object} options 
 * @returns {Object} { valid: Boolean, errors: Array }
 */
export function validateFile(file, options = {}) {
  const { 
    allowedTypes = ['text/csv', 'application/json', 'text/plain'],
    maxSizeMB = 10 
  } = options;
  
  const errors = [];
  
  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.valid) {
    errors.push(typeValidation.error);
  }
  
  const sizeValidation = validateFileSize(file, maxSizeMB);
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.error);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validar array de archivos
 * @param {File[]} files 
 * @param {Object} options 
 * @returns {Object} { valid: Boolean, validFiles: Array, invalidFiles: Array }
 */
export function validateFiles(files, options = {}) {
  if (!files || files.length === 0) {
    return { 
      valid: false, 
      validFiles: [], 
      invalidFiles: [],
      error: 'No files provided' 
    };
  }
  
  const maxFiles = options.maxFiles || 50;
  
  if (files.length > maxFiles) {
    return { 
      valid: false, 
      validFiles: [], 
      invalidFiles: [],
      error: `Demasiados archivos: ${files.length}. Máximo: ${maxFiles}` 
    };
  }
  
  const validFiles = [];
  const invalidFiles = [];
  
  files.forEach(file => {
    const validation = validateFile(file, options);
    
    if (validation.valid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({
        file,
        errors: validation.errors
      });
    }
  });
  
  return {
    valid: invalidFiles.length === 0,
    validFiles,
    invalidFiles,
    totalFiles: files.length,
    validCount: validFiles.length,
    invalidCount: invalidFiles.length
  };
}

/**
 * Validar email
 * @param {String} email 
 * @returns {Object} { valid: Boolean, error: String }
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email no proporcionado' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de email inválido' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validar que un string no esté vacío
 * @param {String} str 
 * @param {String} fieldName 
 * @returns {Object} { valid: Boolean, error: String }
 */
export function validateNotEmpty(str, fieldName = 'Campo') {
  if (!str || typeof str !== 'string' || str.trim().length === 0) {
    return { valid: false, error: `${fieldName} no puede estar vacío` };
  }
  
  return { valid: true, error: null };
}

/**
 * Validar longitud de string
 * @param {String} str 
 * @param {Number} minLength 
 * @param {Number} maxLength 
 * @returns {Object} { valid: Boolean, error: String }
 */
export function validateStringLength(str, minLength = 1, maxLength = 255) {
  if (!str || typeof str !== 'string') {
    return { valid: false, error: 'String no válido' };
  }
  
  if (str.length < minLength) {
    return { valid: false, error: `Longitud mínima: ${minLength} caracteres` };
  }
  
  if (str.length > maxLength) {
    return { valid: false, error: `Longitud máxima: ${maxLength} caracteres` };
  }
  
  return { valid: true, error: null };
}

/**
 * Validar número en rango
 * @param {Number} num 
 * @param {Number} min 
 * @param {Number} max 
 * @returns {Object} { valid: Boolean, error: String }
 */
export function validateNumberRange(num, min, max) {
  if (typeof num !== 'number' || isNaN(num)) {
    return { valid: false, error: 'Valor no es un número válido' };
  }
  
  if (num < min || num > max) {
    return { valid: false, error: `El valor debe estar entre ${min} y ${max}` };
  }
  
  return { valid: true, error: null };
}

