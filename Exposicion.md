# EXPOSICIÓN: AsyncBatch Processor - Dominio de Promises en JavaScript
**Duración total: 10 minutos**

---

## 1. INTRODUCCIÓN (1 minuto)

### Qué son las Promises (30 segundos)
Las Promises son objetos que representan la eventual finalización o fallo de una operación asíncrona. Tienen tres estados: **pending**, **fulfilled** (resuelta) o **rejected** (rechazada). Permiten escribir código asíncrono de forma más legible y manejable que los callbacks tradicionales.

### Problema que resuelven
**Callback Hell** vs **Promises**: Los callbacks anidados crean código difícil de leer y mantener. Las Promises permiten encadenar operaciones asíncronas de forma secuencial con `.then()` o usar `async/await` para código que parece síncrono pero es asíncrono.

### Qué voy a demostrar hoy
Hoy mostraré un sistema completo de procesamiento por lotes que utiliza **Promise.allSettled** para procesamiento paralelo robusto, **async/await con try/catch/finally** para manejo de errores y limpieza garantizada, y **Promise.race** para implementar timeouts. Todo esto en un sistema funcional con operaciones CRUD completas.

---

## 2. DEMO EN VIVO (3 minutos)

### Paso 1: Iniciar la aplicación (30 segundos)
**Acción:** Abrir terminal, ejecutar `npm run dev` en backend y frontend
**Qué decir:** "Aquí tenemos un sistema full-stack con Express y MongoDB en el backend, y Vanilla JS con Vite en el frontend. Todo el manejo asíncrono está implementado con Promises."

### Paso 2: Subir múltiples archivos (1 minuto)
**Acción:** Seleccionar 3-4 archivos diferentes (CSV, JSON, TXT) y hacer clic en "Subir"
**Qué enfatizar:**
- "Observen cómo el sistema procesa múltiples archivos **en paralelo** usando Promise.allSettled"
- "Cada archivo se procesa independientemente - si uno falla, los demás continúan"
- "El progreso se actualiza en tiempo real gracias al manejo asíncrono"

**Qué decir:** "Estoy subiendo múltiples archivos simultáneamente. El backend procesará cada uno de forma independiente. Si un archivo tiene errores, los demás no se ven afectados - esto es gracias a Promise.allSettled que veremos en el código."

### Paso 3: Mostrar resultados y operaciones CRUD (1.5 minutos)
**Acción:** 
- Mostrar la tabla de resultados con estados (completed/failed)
- Hacer clic en "Descargar" en un archivo exitoso
- Hacer clic en "Eliminar" en un archivo
- Mostrar estadísticas del batch

**Qué enfatizar:**
- "Cada operación usa async/await para mantener el código limpio"
- "Los errores se manejan con try/catch sin bloquear la aplicación"
- "Las operaciones de limpieza siempre se ejecutan gracias a finally"

**Qué decir:** "Aquí vemos los resultados del procesamiento. Cada archivo tiene su estado individual. Puedo descargar reportes, eliminar archivos, y todas estas operaciones están implementadas con Promises. Ahora vamos al código para ver cómo funciona internamente."

---

## 3. CODE WALKTHROUGH (5 minutos)

### BLOQUE 1: Promise.allSettled - Procesamiento Paralelo Robusto
**Archivo:** `backend/controllers/fileController.js`  
**Líneas:** 27-56  
**Patrón:** Promise.allSettled para procesamiento paralelo tolerante a fallos

**Explicación (1 minuto):**
"Este es el corazón del sistema. Cuando llegan múltiples archivos, creamos un array de Promises con `map()`, donde cada Promise procesa un archivo independientemente. Luego usamos `Promise.allSettled()` que ejecuta todas las Promises en paralelo y espera a que **todas** terminen, sin importar si algunas fallan."

"La diferencia clave con `Promise.all()` es que `allSettled()` nunca rechaza - siempre espera a todas las Promises. Esto es crítico en procesamiento por lotes porque queremos resultados completos del batch, no que un archivo corrupto detenga todo el proceso."

"Después mapeamos los resultados: si `status === 'fulfilled'`, extraemos los datos; si es `'rejected'`, capturamos el error. Esto nos da un reporte completo del batch con éxitos y fallos."

**Por qué es importante técnicamente:**
- **Escalabilidad:** Procesa N archivos en paralelo, no secuencialmente
- **Resiliencia:** Un fallo no detiene el batch completo
- **Transparencia:** Obtienes resultados de todos los archivos, exitosos o fallidos

---

### BLOQUE 2: async/await con try/catch/finally - Manejo Robusto de Errores y Limpieza
**Archivo:** `backend/controllers/fileController.js`  
**Líneas:** 103-168 (función `processFile`)  
**Patrón:** async/await con try/catch/finally para garantizar limpieza de recursos

**Explicación (1 minuto):**
"Esta función procesa un archivo individual. Usa `async` para marcar la función como asíncrona, y `await` para pausar la ejecución hasta que cada operación se complete. El bloque `try` contiene el flujo exitoso: crear el documento en la BD, parsear el archivo, actualizar el estado."

"El `catch` captura cualquier error - parseo fallido, archivo vacío, error de BD - y actualiza el estado del archivo a 'failed' antes de relanzar el error para que Promise.allSettled lo capture."

"El bloque `finally` es clave: **siempre** se ejecuta, sin importar si hubo éxito o error. Aquí eliminamos el archivo temporal del sistema de archivos con `fs.unlink()`. Esto previene acumulación de archivos temporales incluso si el procesamiento falla. Es un patrón esencial para manejo de recursos."

**Por qué es importante técnicamente:**
- **Limpieza garantizada:** finally asegura que los recursos se liberen siempre
- **Código legible:** async/await es más claro que callbacks o .then() encadenados
- **Manejo de errores centralizado:** try/catch captura errores de múltiples operaciones asíncronas

---

### BLOQUE 3: Promise.race - Implementación de Timeout
**Archivo:** `frontend/src/services/apiService.js`  
**Líneas:** 9-18 (método `fetchWithTimeout`)  
**Patrón:** Promise.race para implementar timeout en peticiones HTTP

**Explicación (1 minuto):**
"Este método implementa un timeout personalizado para peticiones HTTP. Creamos dos Promises: la petición `fetch()` real y un `timeoutPromise` que se rechaza después de 30 segundos usando `setTimeout()`."

"`Promise.race()` ejecuta ambas Promises y retorna la primera que se resuelve o rechaza. Si `fetch()` completa primero, obtenemos la respuesta. Si `timeoutPromise` se rechaza primero, cancelamos la petición y evitamos esperas indefinidas."

"Esto es crítico en aplicaciones web porque las peticiones pueden colgarse por problemas de red. Sin timeout, el usuario esperaría indefinidamente. Con Promise.race, garantizamos que siempre hay una respuesta en un tiempo razonable."

**Por qué es importante técnicamente:**
- **UX mejorada:** Evita esperas indefinidas para el usuario
- **Recursos:** Previene conexiones HTTP colgadas que consumen recursos
- **Patrón reutilizable:** Se usa en todas las peticiones del frontend (upload, delete, get)

---

## 4. CIERRE (1 minuto)

### Operaciones CRUD Implementadas

**CREATE:**
- `POST /api/upload` - Subida múltiple de archivos con procesamiento paralelo
- Ubicación: `backend/controllers/fileController.js:6-99`

**READ:**
- `GET /api/files` - Listado paginado de archivos procesados
- `GET /api/files/:id` - Obtener archivo específico por ID
- `GET /api/batch/:batchId` - Estado de un batch de procesamiento
- `GET /api/files/:id/download` - Descargar datos procesados
- Ubicación: `backend/controllers/fileController.js:166-292`

**UPDATE:**
- `PATCH /api/files/:id` - Actualizar metadatos de archivo (nombre, conteo de registros)
- Ubicación: `backend/controllers/fileController.js:322-375`

**DELETE:**
- `DELETE /api/files/:id` - Eliminar archivo de la base de datos
- Ubicación: `backend/controllers/fileController.js:294-324`

### Métricas del Sistema que Demuestran Calidad

- **Procesamiento paralelo:** Hasta 50 archivos simultáneos (configurable en Multer)
- **Manejo de errores:** 100% de operaciones con try/catch/finally
- **Timeout configurable:** 30 segundos por petición HTTP
- **Limpieza de recursos:** Eliminación garantizada de archivos temporales
- **Resiliencia:** Un archivo fallido no afecta el resto del batch
- **Operaciones asíncronas:** 8 endpoints REST todos con async/await

### Frase de Cierre
"Este proyecto demuestra dominio completo de Promises: desde el procesamiento paralelo robusto con Promise.allSettled, hasta el manejo elegante de errores con async/await y la garantía de limpieza con finally. No es solo código funcional - es código que maneja correctamente la complejidad asíncrona de JavaScript en producción."

---

## 5. PREGUNTAS FRECUENTES

### P1: ¿Por qué usar Promise.allSettled en lugar de Promise.all?
**Respuesta (20 segundos):** "Promise.all rechaza si cualquier Promise falla, deteniendo todo el batch. Promise.allSettled espera a todas las Promises y retorna resultados completos, permitiendo que algunos archivos fallen sin afectar los demás. Es ideal para procesamiento por lotes donde queremos reportes completos."

### P2: ¿Qué pasa si Promise.race tiene ambas Promises rechazadas?
**Respuesta (20 segundos):** "Promise.race retorna la primera que se resuelve o rechaza. Si ambas se rechazan, retorna la primera que se rechazó. En nuestro caso, si fetch falla antes del timeout, obtenemos ese error. Si el timeout ocurre primero, obtenemos el error de timeout. El comportamiento es predecible."

### P3: ¿El finally siempre se ejecuta incluso si hay un return en el try?
**Respuesta (20 segundos):** "Sí, el bloque finally siempre se ejecuta antes de que la función retorne. Es el último código que corre, sin importar si hay return, throw, o éxito normal. Por eso es perfecto para limpieza de recursos como cerrar conexiones o eliminar archivos temporales."

### P4: ¿Hay diferencia de rendimiento entre async/await y .then()?
**Respuesta (20 segundos):** "No hay diferencia de rendimiento - ambos compilan al mismo código. async/await es azúcar sintáctica que hace el código más legible y fácil de depurar. La ventaja es mantenibilidad, no velocidad. En este proyecto elegimos async/await por claridad."

### P5: ¿Cómo manejarías un timeout en el backend, no solo en el frontend?
**Respuesta (20 segundos):** "Podríamos usar Promise.race también en el backend, o usar librerías como `p-timeout` de npm. Otra opción es configurar timeouts a nivel de Express con middleware. La clave es usar Promise.race con una Promise de timeout, igual que en el frontend, pero adaptado al contexto del servidor."

---

**FIN DE LA EXPOSICIÓN**
