/**
 * Upload Middleware
 * Configuración de Multer para manejo de archivos
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpeta uploads si no existe
// En Vercel serverless, usar /tmp para archivos temporales
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Configuración de almacenamiento en disco
 * Define dónde y cómo se guardan los archivos temporalmente
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Carpeta de destino
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp + nombre original
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

/**
 * Filtro para validar tipos de archivo
 * Solo permite CSV, JSON, TXT
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'text/csv',
    'application/json',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Aceptar archivo
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

/**
 * Configuración final de Multer
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo por archivo
    files: 50 // Máximo 50 archivos por request
  }
});

module.exports = upload;
