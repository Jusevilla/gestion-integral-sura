/**
 * ============================================================
 * SW-REGISTER.JS – Registro del Service Worker
 * ============================================================
 * Proyecto de grado – Politécnico Internacional 2026
 *
 * Este archivo se encarga de:
 *  1. Verificar que el navegador soporta Service Workers
 *  2. Registrar el service-worker.js
 *  3. Detectar cuando hay una nueva versión disponible
 *  4. Notificar al usuario sobre actualizaciones
 * ============================================================
 */
 
'use strict';
 
/* ============================================================
   REGISTRO DEL SERVICE WORKER
   Se ejecuta cuando el DOM está completamente cargado.
============================================================ */
window.addEventListener('load', () => {
 
  // Verificar compatibilidad del navegador con Service Workers
  if (!('serviceWorker' in navigator)) {
    console.info('[SW-Register] Este navegador no soporta Service Workers. La app funcionará sin capacidades offline.');
    return;
  }
 
  // Registrar el Service Worker
  navigator.serviceWorker
    .register('./service-worker.js', {
      // El scope define qué URLs controla el SW.
      // './' significa que controla toda la app.
      scope: './'
    })
    .then(registration => {
      console.log('[SW-Register] Service Worker registrado exitosamente.');
      console.log('[SW-Register] Scope:', registration.scope);
 
      // ── Detectar actualizaciones ────────────────────────
      // Se ejecuta cuando hay un nuevo SW esperando activarse
      registration.addEventListener('updatefound', () => {
        const nuevoSW = registration.installing;
        console.log('[SW-Register] Nueva versión del Service Worker detectada.');
 
        nuevoSW.addEventListener('statechange', () => {
          // El nuevo SW está instalado y esperando
          if (nuevoSW.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW-Register] Nueva versión disponible.');
            mostrarNotificacionActualizacion(registration);
          }
        });
      });
 
      // ── Verificar si ya hay un SW esperando al cargar ──
      if (registration.waiting) {
        mostrarNotificacionActualizacion(registration);
      }
    })
    .catch(error => {
      console.error('[SW-Register] Error al registrar el Service Worker:', error);
    });
 
  // ── Recargar la página cuando el SW toma el control ──
  // Esto garantiza que la nueva versión se active correctamente.
  let swCambiando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swCambiando) return;
    swCambiando = true;
    console.log('[SW-Register] Nuevo Service Worker tomó el control. Recargando...');
    window.location.reload();
  });
});
 
/* ============================================================
   FUNCIÓN: Notificación de actualización disponible
   Muestra un banner discreto informando al usuario que
   hay una nueva versión de la app lista para usar.
============================================================ */
 
/**
 * Muestra una notificación en pantalla para que el usuario
 * pueda actualizar la app a la nueva versión disponible.
 * @param {ServiceWorkerRegistration} registration
 */
function mostrarNotificacionActualizacion(registration) {
  // Crear el banner de actualización
  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';
  banner.setAttribute('role', 'alert');
  banner.setAttribute('aria-live', 'polite');
 
  // Estilos del banner (inline para garantizar que se vea
  // independientemente del estado de carga del CSS)
  banner.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #001f6b;
    color: #ffffff;
    padding: 14px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    gap: 14px;
    font-family: 'Noto Sans', sans-serif;
    font-size: 0.84rem;
    z-index: 9999;
    max-width: 90vw;
    animation: slideUpBanner 0.3s ease;
  `;
 
  // Agregar animación dinámica
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUpBanner {
      from { opacity: 0; transform: translateX(-50%) translateY(20px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);
 
  banner.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#f5d800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
    <span>Nueva versión disponible</span>
    <button
      id="btn-pwa-actualizar"
      style="
        background: #f5d800;
        color: #001f6b;
        border: none;
        border-radius: 6px;
        padding: 6px 14px;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      "
      aria-label="Actualizar la aplicación a la nueva versión"
    >
      Actualizar
    </button>
    <button
      id="btn-pwa-cerrar"
      style="
        background: transparent;
        color: rgba(255,255,255,0.6);
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        padding: 0 4px;
        line-height: 1;
      "
      aria-label="Cerrar notificación"
    >
      ✕
    </button>
  `;
 
  document.body.appendChild(banner);
 
  // Botón "Actualizar": activa el nuevo SW y recarga
  document.getElementById('btn-pwa-actualizar').addEventListener('click', () => {
    if (registration.waiting) {
      // Enviar mensaje al SW para que se active inmediatamente
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    banner.remove();
  });
 
  // Botón "✕": cierra el banner sin actualizar
  document.getElementById('btn-pwa-cerrar').addEventListener('click', () => {
    banner.remove();
  });
 
  // Auto-ocultar después de 12 segundos
  setTimeout(() => {
    if (document.getElementById('pwa-update-banner')) {
      banner.remove();
    }
  }, 12000);
}
 
/* ============================================================
   FUNCIÓN: Detectar si la app está instalada como PWA
   Útil para ajustar la UI cuando corre en modo standalone.
============================================================ */
 
/**
 * Devuelve true si la app está corriendo instalada (modo standalone).
 * @returns {boolean}
 */
function esAppInstalada() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}
 
// Agregar clase al body si corre como app instalada
if (esAppInstalada()) {
  document.body.classList.add('pwa-standalone');
  console.info('[SW-Register] App corriendo en modo instalado (standalone).');
}