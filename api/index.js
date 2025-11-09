/**
 * Vercel Serverless Function Handler
 * Wrapper para Express app en Vercel
 */

const express = require('express');
const cors = require('cors');
const connectDB = require('../backend/config/database');
const fileRoutes = require('../backend/routes/fileRoutes');

const app = express();

// Conectar a MongoDB (solo una vez)
let dbConnected = false;
const connectDBOnce = async () => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
};

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' })); // Aumentar límite para archivos
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging de requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api', fileRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Exportar para Vercel serverless
module.exports = async (req, res) => {
  await connectDBOnce();
  return app(req, res);
};

