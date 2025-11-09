/**
 * Log Model
 * Schema para logs de batch processing
 */

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    index: true
  },
  filesProcessed: {
    type: Number,
    default: 0
  },
  filesSucceeded: {
    type: Number,
    default: 0
  },
  filesFailed: {
    type: Number,
    default: 0
  },
  errorDetails: [{
    filename: String,
    error: String,
    timestamp: Date
  }],
  startedAt: {
    type: Date,
    default: Date.now,
    index: -1
  },
  completedAt: {
    type: Date,
    default: null
  },
  totalProcessingTime: {
    type: Number, // En milisegundos
    default: 0
  }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

module.exports = mongoose.model('Log', logSchema);
