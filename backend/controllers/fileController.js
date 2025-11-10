const File = require('../models/FileModel');
const Log = require('../models/LogModel');
const { parseFile } = require('../utils/fileParser');
const fs = require('fs').promises;
const crypto = require('crypto');
exports.uploadFiles = async (req, res) => {
  const startTime = Date.now();
  const batchId = crypto.randomUUID(); // Generar ID único para este batch
  
  try {
    // Validar que haya archivos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se recibieron archivos'
      });
    }

    console.log(`Procesando batch ${batchId} con ${req.files.length} archivos`);

    const log = await Log.create({
      batchId,
      filesProcessed: req.files.length,
      startedAt: new Date()
    });

    const processingPromises = req.files.map(file => 
      processFile(file, batchId)
    );

    // QUÉ HACE: Promise.allSettled ejecuta todas las Promises en paralelo y espera a que todas terminen, retornando un array con el estado (fulfilled/rejected) de cada una
    // POR QUÉ: Permite procesar múltiples archivos simultáneamente sin que un error detenga el resto, obteniendo resultados completos del batch completo
    const results = await Promise.allSettled(processingPromises);
    const processedResults = results.map((result, index) => {
      const file = req.files[index];

      if (result.status === 'fulfilled') {
        return {
          filename: file.originalname,
          status: 'completed',
          recordsCount: result.value.recordsCount,
          processingTime: result.value.processingTime,
          data: result.value.data,
          errorMessage: null
        };
      } else {
        return {
          filename: file.originalname,
          status: 'failed',
          recordsCount: 0,
          processingTime: 0,
          data: null,
          errorMessage: result.reason.message
        };
      }
    });

    // Calcular estadísticas
    const succeeded = processedResults.filter(r => r.status === 'completed').length;
    const failed = processedResults.filter(r => r.status === 'failed').length;
    const totalTime = Date.now() - startTime;

    // Actualizar log
    await Log.findByIdAndUpdate(log._id, {
      filesSucceeded: succeeded,
      filesFailed: failed,
      completedAt: new Date(),
      totalProcessingTime: totalTime,
      errorDetails: processedResults
        .filter(r => r.status === 'failed')
        .map(r => ({
          filename: r.filename,
          error: r.errorMessage,
          timestamp: new Date()
        }))
    });

    console.log(`Batch ${batchId} completado: ${succeeded} éxitos, ${failed} fallos`);
    res.status(200).json({
      success: true,
      message: 'Procesamiento completado',
      data: processedResults,
      stats: {
        total: req.files.length,
        succeeded,
        failed,
        totalProcessingTime: totalTime
      },
      batchId
    });

  } catch (error) {
    console.error('Error en uploadFiles:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error procesando archivos',
      error: error.message
    });
  }
};

async function processFile(file, batchId) {
  const startTime = Date.now();
  let fileDoc = null;

  // QUÉ HACE: async marca la función como asíncrona, await pausa hasta que las Promises se resuelvan, try maneja el flujo exitoso, catch captura errores, finally siempre ejecuta limpieza
  // POR QUÉ: Permite procesar archivos de forma asíncrona con manejo de errores robusto, garantizando que los archivos temporales se eliminen siempre (finally) incluso si hay errores
  try {
    fileDoc = await File.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      status: 'processing',
      uploadedAt: new Date()
    });

    console.log(`Procesando archivo: ${file.originalname}`);

    const parsedData = await parseFile(file.path, file.mimetype);

    if (!parsedData || (Array.isArray(parsedData) && parsedData.length === 0)) {
      throw new Error('El archivo está vacío o no contiene datos válidos');
    }

    const recordsCount = Array.isArray(parsedData) ? parsedData.length : 1;
    const processingTime = Date.now() - startTime;
    
    await File.findByIdAndUpdate(fileDoc._id, {
      status: 'completed',
      recordsCount,
      data: parsedData,
      processingTime,
      processedAt: new Date(),
      errorMessage: null
    });

    console.log(`Archivo procesado: ${file.originalname} (${recordsCount} registros)`);

    return {
      fileId: fileDoc._id,
      recordsCount,
      processingTime,
      data: parsedData
    };

  } catch (error) {
    console.error(`Error procesando ${file.originalname}:`, error.message);

    if (fileDoc) {
      await File.findByIdAndUpdate(fileDoc._id, {
        status: 'failed',
        errorMessage: error.message,
        processedAt: new Date()
      });
    }

    throw error;

  } finally {
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error(`No se pudo eliminar archivo temporal: ${file.filename}`);
    }
  }
}

exports.getProcessedFiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [files, totalCount] = await Promise.all([
      File.find()
        .select('-data') // Excluir campo data (puede ser grande)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit),
      File.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: files,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalFiles: totalCount,
        filesPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error obteniendo archivos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo archivos procesados',
      error: error.message
    });
  }
};

exports.getFileById = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: file
    });

  } catch (error) {
    console.error('Error obteniendo archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo archivo',
      error: error.message
    });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    if (file.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'El archivo no fue procesado exitosamente'
      });
    }

    // Enviar datos como JSON para descarga
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}_processed.json"`);
    res.status(200).json(file.data);

  } catch (error) {
    console.error('Error descargando archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error descargando archivo',
      error: error.message
    });
  }
};

exports.getBatchStatus = async (req, res) => {
  try {
    const { batchId } = req.params;

    const log = await Log.findOne({ batchId });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Batch no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: log,
      processing: log.completedAt === null
    });

  } catch (error) {
    console.error('Error obteniendo estado del batch:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado del batch',
      error: error.message
    });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findByIdAndDelete(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando archivo',
      error: error.message
    });
  }
};

exports.updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalName, recordsCount } = req.body;

    // Validar que al menos un campo esté presente
    if (!originalName && recordsCount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar (originalName o recordsCount)'
      });
    }

    // Construir objeto de actualización solo con campos proporcionados
    const updateData = {};
    if (originalName !== undefined) {
      updateData.originalName = originalName;
    }
    if (recordsCount !== undefined) {
      updateData.recordsCount = recordsCount;
    }

    const file = await File.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: file,
      message: 'Archivo actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando archivo',
      error: error.message
    });
  }
};

module.exports = exports;
