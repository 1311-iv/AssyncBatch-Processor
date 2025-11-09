/**
 * File Routes
 * Define endpoints de la API
 */

const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const upload = require('../middleware/uploadMiddleware');

/**
 * POST /api/upload
 * Upload múltiple de archivos
 * Usa middleware Multer para procesar multipart/form-data
 */
router.post('/upload', upload.array('files', 50), fileController.uploadFiles);

/**
 * GET /api/files
 * Obtener archivos procesados con paginación
 * Query params: page, limit
 */
router.get('/files', fileController.getProcessedFiles);

/**
 * GET /api/files/:id
 * Obtener archivo específico por ID
 */
router.get('/files/:id', fileController.getFileById);

/**
 * GET /api/files/:id/download
 * Descargar datos procesados de un archivo
 */
router.get('/files/:id/download', fileController.downloadFile);

/**
 * GET /api/batch/:batchId
 * Obtener estado de un batch
 */
router.get('/batch/:batchId', fileController.getBatchStatus);

/**
 * DELETE /api/files/:id
 * Eliminar archivo procesado
 */
router.delete('/files/:id', fileController.deleteFile);

module.exports = router;
