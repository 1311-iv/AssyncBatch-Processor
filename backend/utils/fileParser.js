const fs = require('fs').promises;
const path = require('path');

async function parseJSON(filePath) {
  try {
    // fs.readFile con Promises
    const content = await fs.readFile(filePath, 'utf-8');
    
    // JSON.parse es síncrono pero puede lanzar error
    const data = JSON.parse(content);
    
    return data;
  } catch (error) {
    throw new Error(`Error parseando JSON: ${error.message}`);
  }
}

async function parseCSV(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Split por líneas
    const lines = content.trim().split('\n');
    
    if (lines.length === 0) {
      throw new Error('Archivo CSV vacío');
    }

    // Primera línea son headers
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Parsear cada línea como objeto
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      return obj;
    });

    return data;
  } catch (error) {
    throw new Error(`Error parseando CSV: ${error.message}`);
  }
}

async function parseTXT(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    return lines.map((line, index) => ({
      lineNumber: index + 1,
      content: line.trim()
    }));
  } catch (error) {
    throw new Error(`Error parseando TXT: ${error.message}`);
  }
}

async function parseFile(filePath, mimeType) {
  switch (mimeType) {
    case 'application/json':
      return await parseJSON(filePath);
    
    case 'text/csv':
      return await parseCSV(filePath);
    
    case 'text/plain':
      return await parseTXT(filePath);
    
    default:
      throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
  }
}

module.exports = {
  parseJSON,
  parseCSV,
  parseTXT,
  parseFile
};
