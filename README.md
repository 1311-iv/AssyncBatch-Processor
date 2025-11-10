# AsyncBatch Processor

Sistema de procesamiento por lotes con Promises en JavaScript.

## Deploy

### Backend (Render)
- URL: [tu-url-render]
- Variables de entorno configuradas en Render dashboard

### Frontend (Vercel)
- URL: [tu-url-vercel]
- Variables de entorno configuradas en Vercel dashboard

## Variables de Entorno

### Backend
- `MONGODB_URI`: Connection string de MongoDB Atlas
- `FRONTEND_URL`: URL del frontend en Vercel
- `NODE_ENV`: production
- `PORT`: Asignado automáticamente por Render

### Frontend
- `VITE_API_URL`: URL del backend en Render (incluir `/api` al final)
