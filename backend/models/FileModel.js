/**
 * File Model
 * Schema para archivos procesados
 */

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  recordsCount: {
    type: Number,
    default: 0
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Acepta cualquier tipo
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  processingTime: {
    type: Number, // En milisegundos
    default: 0
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Índices para búsquedas rápidas
fileSchema.index({ filename: 1 });
fileSchema.index({ status: 1 });
fileSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('File', fileSchema);
