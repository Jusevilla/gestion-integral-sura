/**
 * ============================================================
 * SERVICE WORKER – Solicitudes Gestión Integral SURA
 * ============================================================
 * Proyecto de grado – Politécnico Internacional 2026
 *
 * Este Service Worker gestiona:
 *  1. Instalación y pre-caché de los recursos estáticos
 *  2. Estrategia de caché: Cache First con fallback a red
 *  3. Actualización automática al detectar nueva versión
 *  4. Funcionamiento offline básico
 * ============================================================
 */
 
'use strict';
 
/* ============================================================
   CONFIGURACIÓN
============================================================ */
 
/**
 * Nombre del caché. Cambia el número de versión cada vez
 * que publiques una actualización del proyecto.
 * @type {string}
 */
const CACHE_NAME = 'gestion-integral-sura-v1.0.0';
 
/**
 * Lista de recursos que se guardan en caché durante la
 * instalación del Service Worker (pre-caché).
 * Incluye todos los archivos necesarios para funcionar offline.
 * @type {string[]}
 */
const RECURSOS_CACHE = [
  './',
  './index.html',
  './style.css',
  './funcionamiento.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  // Google Fonts – se cachean en la primera visita con conexión
  'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Noto+Sans:wght@300;400;500;600&display=swap'
];
 
/* ============================================================
   EVENTO: INSTALL
   Se ejecuta cuando el Service Worker se registra por primera vez.
   Guarda todos los recursos estáticos en caché.
============================================================ */
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker versión:', CACHE_NAME);
 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-cacheando recursos estáticos...');
        // addAll falla si algún recurso no se puede cargar.
        // Usamos Promise.allSettled para que falle de forma silenciosa
        // en recursos opcionales como las fuentes de Google.
        return Promise.allSettled(
          RECURSOS_CACHE.map(url =>
            cache.add(url).catch(err =>
              console.warn('[SW] No se pudo cachear:', url, err)
            )
          )
        );
      })
      .then(() => {
        console.log('[SW] Instalación completada.');
        // Fuerza al SW a activarse inmediatamente sin esperar
        // a que se cierren las pestañas abiertas.
        return self.skipWaiting();
      })
  );
});
 
/* ============================================================
   EVENTO: ACTIVATE
   Se ejecuta cuando el SW toma el control.
   Limpia cachés de versiones anteriores.
============================================================ */
self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker:', CACHE_NAME);
 
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            // Filtra solo los cachés que pertenecen a esta app
            // pero que son de versiones anteriores
            .filter(name =>
              name.startsWith('gestion-integral-sura-') && name !== CACHE_NAME
            )
            .map(name => {
              console.log('[SW] Eliminando caché obsoleto:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activación completada. Tomando control de todas las pestañas.');
        // Toma el control de todas las páginas abiertas inmediatamente
        return self.clients.claim();
      })
  );
});
 
/* ============================================================
   EVENTO: FETCH
   Intercepta todas las peticiones de red.
   Estrategia: Cache First → si no está en caché, busca en red
   y actualiza el caché para la próxima vez.
============================================================ */
self.addEventListener('fetch', event => {
  const request = event.request;
 
  // Solo manejar peticiones GET
  if (request.method !== 'GET') return;
 
  // No interceptar peticiones a extensiones del navegador
  if (!request.url.startsWith('http')) return;
 
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
 
        // ── Estrategia Cache First ──────────────────────────
        // Si el recurso está en caché, lo devuelve inmediatamente
        if (cachedResponse) {
          // En segundo plano, actualiza el caché con la versión más reciente
          actualizarCacheEnSegundoPlano(request);
          return cachedResponse;
        }
 
        // ── Fallback a la red ───────────────────────────────
        // Si no está en caché, lo busca en la red
        return fetch(request)
          .then(networkResponse => {
            // Verificar que la respuesta sea válida antes de cachear
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type !== 'opaque-redirect'
            ) {
              // Guarda una copia en caché para uso futuro
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // ── Fallback offline ─────────────────────────────
            // Si no hay red y no está en caché, devuelve la página principal
            console.warn('[SW] Sin conexión. Sirviendo página offline.');
            return caches.match('./index.html');
          });
      })
  );
});
 
/* ============================================================
   FUNCIÓN AUXILIAR: Actualización en segundo plano
   Refresca el recurso en caché sin bloquear la respuesta actual.
============================================================ */
 
/**
 * Actualiza un recurso del caché en segundo plano (stale-while-revalidate).
 * @param {Request} request - La petición a revalidar
 */
function actualizarCacheEnSegundoPlano(request) {
  fetch(request)
    .then(networkResponse => {
      if (networkResponse && networkResponse.status === 200) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, networkResponse);
        });
      }
    })
    .catch(() => {
      // Sin conexión: no hay problema, usamos el caché existente
    });
}
 
/* ============================================================
   EVENTO: MESSAGE
   Permite que la página se comunique con el Service Worker.
   Por ejemplo, para forzar una actualización manual.
============================================================ */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Forzando actualización por solicitud de la página.');
    self.skipWaiting();
  }
 
  if (event.data && event.data.type === 'GET_VERSION') {
    event.source.postMessage({ type: 'VERSION', version: CACHE_NAME });
  }
});