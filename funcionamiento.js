/**
 * ============================================================
 * MÓDULO: DATOS SIMULADOS
 * Usuarios, saldos a favor y solicitudes previas (demo)
 * ============================================================
 */
 
/** @type {Array<{id:string,password:string,name:string,email:string,role:string,cod:string}>} */
const USERS = [
  { id: 'asesor01', password: 'pass123', name: 'Juan Sebastian Villacres.', email: 'juan.villacres@sura.com', role: 'Asesor', cod: 'ASE-0042' },
  { id: 'admin',    password: 'admin123', name: 'Laura Martínez Cano',   email: 'lmartinez@sura.com', role: 'Administrador', cod: 'ADM-0001' }
];
 
/**
 * Saldos a favor disponibles para devolución (datos simulados)
 * @type {Array<Object>}
 */
const SALDOS_FAVOR = [
  { id: 1, cliente: 'CATAR ARQUITECTOS E INGENIEROS', identificacion: '0021403', poliza: '012000415245', recibo: '16262074', saldo: -568906 },
  { id: 2, cliente: 'PIPE SUPPLY AND SERVICES S.A.S', identificacion: '1571892', poliza: '012002513736', recibo: '900157',   saldo: -34282  },
  { id: 3, cliente: 'DISTRIBUIDORA NORTE LTDA',       identificacion: '8005123', poliza: '010001238765', recibo: '774123',   saldo: -120500 },
];
 
/**
 * Almacén de solicitudes en memoria (simulando una BD)
 * @type {Array<Object>}
 */
let SOLICITUDES = [
  { radicado: 20296, tipo: 'Legalización Transferencias', cliente: 'ACME S.A.S',         id: '900123456', poliza: '011002345678', estado: 'Gestionado',  fecha: '2025-03-20 10:15', comentario: '' },
  { radicado: 27600, tipo: 'Estado de Cuenta',            cliente: 'María Torres',        id: '52456789',  poliza: '010001234567', estado: 'En gestión',  fecha: '2025-03-22 09:00', comentario: '' },
  { radicado: 28236, tipo: 'Abonos y Cruces',             cliente: 'Constructora Paz SAS',id: '800987654', poliza: '012003456789', estado: 'Rechazado',   fecha: '2025-03-24 14:30', comentario: 'Póliza no abonada según políticas de cartera.' },
  { radicado: 29248, tipo: 'Certificados Onerosos',       cliente: 'Carlos Pérez Roa',    id: '71234567',  poliza: '011005678901', estado: 'Rechazado',   fecha: '2025-03-25 08:45', comentario: 'Falta carátula de póliza empresarial.' },
  { radicado: 32026, tipo: 'Pagos en Dólares',            cliente: 'Import & Export Ltda',id: '830056789', poliza: '013009012345', estado: 'En gestión',  fecha: '2025-03-27 15:22', comentario: '' },
];
 
/** Contador de radicados */
let RADICADO_COUNTER = 40000;
 
/** Sesión activa */
let SESSION = null;
 
/* ============================================================
   MÓDULO: AUTENTICACIÓN Y SESIÓN
============================================================ */
 
/**
 * Inicializa el formulario de login y sus eventos.
 */
function initLogin() {
  document.getElementById('form-login').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');
    const btnEl = document.getElementById('btn-login');
 
    // Buscar usuario en datos simulados
    const found = USERS.find(u => u.id === user && u.password === pass);
 
    if (!found) {
      errEl.textContent = 'Usuario o contraseña incorrectos. Revisa los datos de acceso.';
      errEl.classList.remove('hidden');
      return;
    }
 
    errEl.classList.add('hidden');
    btnEl.textContent = 'Ingresando...';
    btnEl.disabled = true;
 
    // Simular latencia de red
    setTimeout(() => {
      SESSION = found;
      startApp();
    }, 600);
  });
}
 
/**
 * Inicia la aplicación post-autenticación.
 */
function startApp() {
 // Guardar sesión en sessionStorage para persistir al recargar
  sessionStorage.setItem('session', JSON.stringify(SESSION));
  // Ocultar login, mostrar app
  document.getElementById('screen-login').style.display = 'none';
  const app = document.getElementById('screen-app');
  app.classList.add('active');
 
  // Actualizar header
  document.getElementById('hdr-user-name').textContent = SESSION.name;
  document.getElementById('hdr-user-role').textContent  = SESSION.role;
  document.getElementById('hdr-avatar').textContent     = getInitials(SESSION.name);
 
  // Mostrar nav de admin si corresponde
  if (SESSION.role === 'Administrador') {
    document.querySelectorAll('.nav-admin').forEach(el => el.classList.remove('hidden'));
  }
 
  // Pre-rellenar correo en todos los formularios
  prefillEmails();
 
  // Actualizar dashboard
  updateDashboard();
 
  // Renderizar tabla de devoluciones
  renderDevoluciones();
 
  // Actualizar perfil
  renderPerfil();
 
  // Activar vista inicial
  navigate('dashboard');
}
 
/**
 * Cierra la sesión y vuelve al login.
 */
function logout() {
  SESSION = null;
 // Limpiar sesión guardada al cerrar sesión manualmente
  sessionStorage.removeItem('session');
  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-login').style.display = 'flex';
  document.getElementById('btn-login').disabled = false;
  document.getElementById('btn-login').textContent = 'Ingresar al sistema';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  closeSidebar();
}
 
/**
 * Retorna las iniciales de un nombre.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
}
 
/**
 * Pre-rellena el campo de correo en todos los formularios con el del usuario activo.
 */
function prefillEmails() {
  ['leg','abo','cert','ec','dol'].forEach(prefix => {
    const el = document.getElementById(`${prefix}-correo`);
    if (el && SESSION) el.value = SESSION.email;
  });
}
 
/* ============================================================
   MÓDULO: NAVEGACIÓN (SPA Router)
============================================================ */
 
/**
 * Navega a una vista específica del SPA.
 * @param {string} viewId - Identificador de la vista (sin prefijo 'view-')
 */
function navigate(viewId) {
  // Ocultar todas las vistas
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
 
  // Activar la vista solicitada
  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.add('active');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
 
  // Actualizar nav activo
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });
 
  // Acciones específicas por vista
  if (viewId === 'dashboard')       updateDashboard();
  if (viewId === 'estado-solicitud') renderSolicitudesTable();
  if (viewId === 'admin')           renderAdminTable();
  if (viewId === 'devoluciones')    renderDevoluciones();
 
  closeSidebar();
}
 
/**
 * Inicializa los listeners de navegación.
 */
function initNav() {
  // Nav items del sidebar
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.view));
    item.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(item.dataset.view); });
  });
 
  // Accesos rápidos del dashboard
  document.querySelectorAll('[data-goto]').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.goto));
    item.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(item.dataset.goto); });
  });
 
  // Botón logout
  document.getElementById('btn-logout').addEventListener('click', logout);
 
  // Sidebar toggle (móvil)
  document.getElementById('btn-sidebar-toggle').addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
}
 
function toggleSidebar() {
  const sb = document.getElementById('app-sidebar');
  const ov = document.getElementById('sidebar-overlay');
  const btn = document.getElementById('btn-sidebar-toggle');
  const isOpen = !sb.classList.contains('collapsed');
  sb.classList.toggle('collapsed', isOpen);
  ov.classList.toggle('active', !isOpen);
  btn.setAttribute('aria-expanded', String(!isOpen));
}
 
function closeSidebar() {
  const sb = document.getElementById('app-sidebar');
  const ov = document.getElementById('sidebar-overlay');
  // Solo cerrar en móvil (< 1024px)
  if (window.innerWidth < 1024) {
    sb.classList.add('collapsed');
    ov.classList.remove('active');
  }
}
 
/* ============================================================
   MÓDULO: DASHBOARD
============================================================ */
 
/**
 * Actualiza los contadores y la tabla resumen del dashboard.
 */
function updateDashboard() {
  if (!SESSION) return;
 
  // Bienvenida personalizada
  document.getElementById('dash-name').textContent = `Bienvenido, ${SESSION.name.split(' ')[0]}`;
  document.getElementById('dash-info').textContent = `${SESSION.role} · ${SESSION.email}`;
 
  // Contadores
  const total     = SOLICITUDES.length;
  const gestionado = SOLICITUDES.filter(s => s.estado === 'Gestionado').length;
  const enGestion  = SOLICITUDES.filter(s => s.estado === 'En gestión').length;
  const rechazado  = SOLICITUDES.filter(s => s.estado === 'Rechazado').length;
 
  document.getElementById('stat-total').textContent     = total;
  document.getElementById('stat-gestion').textContent   = gestionado;
  document.getElementById('stat-proceso').textContent   = enGestion;
  document.getElementById('stat-rechazado').textContent = rechazado;
 
  // Badge sidebar
  document.getElementById('nb-devoluciones').textContent = SALDOS_FAVOR.length;
 
  // Tabla últimas 5 solicitudes
  const tbody = document.getElementById('dash-table-body');
  const ultimas = [...SOLICITUDES].reverse().slice(0, 5);
  if (ultimas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--text-light);padding:24px;">Sin solicitudes registradas</td></tr>';
    return;
  }
  tbody.innerHTML = ultimas.map(s => `
    <tr>
      <td><strong>#${s.radicado}</strong></td>
      <td>${s.tipo}</td>
      <td>${s.cliente}</td>
      <td>${estadoBadge(s.estado)}</td>
      <td style="color:var(--text-light);font-size:0.8rem;">${s.fecha}</td>
    </tr>
  `).join('');
}
 
/* ============================================================
   MÓDULO: VALIDACIÓN DE FORMULARIOS
============================================================ */
 
/**
 * Configuración de campos obligatorios por tipo de solicitud.
 * Cada entrada mapea a los IDs de los campos requeridos.
 */
const FORM_RULES = {
  legalizacion:  { ids: ['leg-cod-asesor','leg-nombre','leg-id','leg-poliza','leg-recibo','leg-fecha'], errorId: 'leg-error' },
  abonos:        { ids: ['abo-cod-asesor','abo-nombre','abo-id','abo-poliza','abo-recibo','abo-poliza-dev','abo-recibo-dev'], errorId: 'abo-error' },
  certificados:  { ids: ['cert-cod-asesor','cert-nombre','cert-id','cert-poliza','cert-solucion','cert-fecha-ini','cert-fecha-fin','cert-beneficiario'], errorId: 'cert-error' },
  estadocuenta:  { ids: ['ec-cod-asesor','ec-nombre','ec-id','ec-poliza','ec-fecha-ini','ec-fecha-fin'], errorId: 'ec-error' },
  dolares:       { ids: ['dol-cod-asesor','dol-nombre','dol-id','dol-poliza','dol-fecha','dol-moneda'], errorId: 'dol-error' },
};
 
/**
 * Valida los campos obligatorios de un formulario.
 * @param {string} tipo - Clave del tipo de solicitud
 * @returns {boolean} true si válido
 */
function validateForm(tipo) {
  const rule = FORM_RULES[tipo];
  if (!rule) return true;
 
  let valid = true;
  const emptyFields = [];
 
  rule.ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.value.trim();
    if (!val) {
      el.classList.add('error');
      emptyFields.push(el.previousElementSibling?.textContent?.replace('*','').trim() || id);
      valid = false;
    } else {
      el.classList.remove('error');
    }
  });
 
  const errEl = document.getElementById(rule.errorId);
  if (!valid) {
    errEl.textContent = `Campos obligatorios incompletos: ${emptyFields.join(', ')}.`;
    errEl.classList.remove('hidden');
  } else {
    errEl.classList.add('hidden');
  }
 
  return valid;
}
 
/* ============================================================
   MÓDULO: ENVÍO DE SOLICITUDES
============================================================ */
 
/**
 * Mapa de tipos legibles por nombre de proceso.
 */
const TIPO_LABELS = {
  legalizacion: 'Legalización Transferencias',
  abonos:       'Abonos y Cruces',
  certificados: 'Certificados Onerosos',
  estadocuenta: 'Estado de Cuenta',
  dolares:      'Pagos en Dólares',
};
 
/**
 * Extrae los datos principales de un formulario para guardarlo.
 * @param {string} tipo
 * @returns {Object}
 */
function extractFormData(tipo) {
  const map = {
    legalizacion: { nombre: 'leg-nombre', id: 'leg-id', poliza: 'leg-poliza' },
    abonos:       { nombre: 'abo-nombre', id: 'abo-id', poliza: 'abo-poliza' },
    certificados: { nombre: 'cert-nombre', id: 'cert-id', poliza: 'cert-poliza' },
    estadocuenta: { nombre: 'ec-nombre',  id: 'ec-id',  poliza: 'ec-poliza' },
    dolares:      { nombre: 'dol-nombre', id: 'dol-id', poliza: 'dol-poliza' },
  };
  const m = map[tipo] || {};
  return {
    cliente: document.getElementById(m.nombre)?.value || '—',
    idCliente: document.getElementById(m.id)?.value || '—',
    poliza:  document.getElementById(m.poliza)?.value || '—',
  };
}
 
/**
 * Procesa y radica una solicitud.
 * @param {string} tipo - Clave del tipo de solicitud
 */
function submitSolicitud(tipo) {
  if (!validateForm(tipo)) return;
 
  const data = extractFormData(tipo);
  const radicado = ++RADICADO_COUNTER;
  const now = new Date();
  const fecha = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
 
  /** Nueva solicitud */
  const nuevaSolicitud = {
    radicado,
    tipo: TIPO_LABELS[tipo],
    cliente: data.cliente,
    id: data.idCliente,
    poliza: data.poliza,
    estado: 'En gestión',
    fecha,
    comentario: '',
    usuario: SESSION?.id || 'asesor01',
  };
 
  SOLICITUDES.push(nuevaSolicitud);
 
  // Limpiar formulario
  resetForm(`form-${tipo}`, `files-${tipo.slice(0,3)}`, `file-${tipo.slice(0,3)}`);
 
  // Mostrar modal de éxito
  showModal('success', '¡Solicitud radicada!',
    `Tu solicitud de <strong>${TIPO_LABELS[tipo]}</strong> fue enviada exitosamente. Recibirás un correo de confirmación en <strong>${SESSION?.email}</strong>.`,
    radicado
  );
 
  updateDashboard();
}
 
/* ============================================================
   MÓDULO: GESTIÓN DE DEVOLUCIONES
============================================================ */
 
/** Devolución actualmente seleccionada */
let selectedDevolucion = null;
 
/**
 * Renderiza la tabla de saldos a favor disponibles.
 * @param {string} [filtro=''] - ID de cliente para filtrar
 */
function renderDevoluciones(filtro = '') {
  const tbody = document.getElementById('dev-table-body');
  let datos = SALDOS_FAVOR;
  if (filtro) {
    datos = datos.filter(d => d.identificacion.includes(filtro));
  }
  if (datos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:var(--text-light);padding:24px;">No se encontraron saldos a favor con ese filtro.</td></tr>';
    return;
  }
  tbody.innerHTML = datos.map(d => `
    <tr class="dev-row">
      <td>${d.cliente}</td>
      <td>${d.identificacion}</td>
      <td>${d.poliza}</td>
      <td>${d.recibo}</td>
      <td style="font-weight:700;color:var(--success);">$ ${Math.abs(d.saldo).toLocaleString('es-CO')}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="seleccionarDevolucion(${d.id})" aria-label="Solicitar devolución para ${d.cliente}">
          Solicitar
        </button>
      </td>
    </tr>
  `).join('');
}
 
/**
 * Filtra la tabla de devoluciones por el valor del campo.
 * @param {boolean} [reset=false] - Si true, limpia el filtro
 */
function filtrarDevoluciones(reset = false) {
  const input = document.getElementById('dev-filter');
  if (reset) { input.value = ''; renderDevoluciones(); return; }
  renderDevoluciones(input.value.trim());
}
 
/**
 * Activa el formulario de devolución para un saldo seleccionado.
 * @param {number} id
 */
function seleccionarDevolucion(id) {
  selectedDevolucion = SALDOS_FAVOR.find(d => d.id === id);
  if (!selectedDevolucion) return;
 
  // Mostrar resumen
  document.getElementById('dev-resumen').innerHTML = `
    <strong>Cliente:</strong> ${selectedDevolucion.cliente} &nbsp;|&nbsp;
    <strong>ID:</strong> ${selectedDevolucion.identificacion} &nbsp;|&nbsp;
    <strong>Póliza:</strong> ${selectedDevolucion.poliza} &nbsp;|&nbsp;
    <strong>Saldo:</strong> <span style="color:var(--success);font-weight:700;">$ ${Math.abs(selectedDevolucion.saldo).toLocaleString('es-CO')}</span>
  `;
 
  document.getElementById('dev-form-card').classList.remove('hidden');
  document.getElementById('dev-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
 
/** Cancela la selección de devolución. */
function cancelarDevolucion() {
  selectedDevolucion = null;
  document.getElementById('dev-form-card').classList.add('hidden');
  document.getElementById('form-devolucion').reset();
  document.getElementById('dev-error').classList.add('hidden');
}
 
/** Envía la solicitud de devolución. */
function submitDevolucion() {
  if (!selectedDevolucion) return;
 
  const campos = ['dev-tipo-id', 'dev-entidad', 'dev-tipo-cuenta', 'dev-num-cuenta'];
  let valid = true;
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.classList.add('error'); valid = false; }
    else el.classList.remove('error');
  });
 
  if (!valid) {
    const errEl = document.getElementById('dev-error');
    errEl.textContent = 'Completa todos los campos bancarios para habilitar el envío.';
    errEl.classList.remove('hidden');
    return;
  }
 
  const radicado = ++RADICADO_COUNTER;
  const now = new Date();
  const fecha = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
 
  SOLICITUDES.push({
    radicado,
    tipo: 'Devolución',
    cliente: selectedDevolucion.cliente,
    id: selectedDevolucion.identificacion,
    poliza: selectedDevolucion.poliza,
    estado: 'En gestión',
    fecha,
    comentario: '',
    usuario: SESSION?.id || 'asesor01',
  });
 
  cancelarDevolucion();
  showModal('success', '¡Devolución radicada!',
    `La solicitud de devolución para <strong>${selectedDevolucion?.cliente}</strong> fue enviada exitosamente. Tiempo estimado de gestión: <strong>3 a 5 días hábiles</strong>.`,
    radicado
  );
  updateDashboard();
}
 
/* ============================================================
   MÓDULO: TABLA DE SOLICITUDES (Estado)
============================================================ */
 
/**
 * Renderiza la tabla de solicitudes aplicando los filtros activos.
 */
function renderSolicitudesTable() {
  const tipoFilter  = document.getElementById('filter-tipo')?.value  || '';
  const estadoFilter= document.getElementById('filter-estado')?.value|| '';
  const radFilter   = document.getElementById('filter-radicado')?.value.trim() || '';
 
  let datos = [...SOLICITUDES].reverse();
  if (tipoFilter)  datos = datos.filter(s => s.tipo === tipoFilter);
  if (estadoFilter)datos = datos.filter(s => s.estado === estadoFilter);
  if (radFilter)   datos = datos.filter(s => String(s.radicado).includes(radFilter));
 
  const tbody = document.getElementById('solicitudes-body');
  if (datos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="color:var(--text-light);padding:24px;">No se encontraron solicitudes con los filtros aplicados.</td></tr>';
    return;
  }
  tbody.innerHTML = datos.map(s => `
    <tr>
      <td><strong>#${s.radicado}</strong></td>
      <td><span style="font-size:0.82rem;">${s.tipo}</span></td>
      <td>${s.cliente}</td>
      <td>${s.id}</td>
      <td>${s.poliza}</td>
      <td>${estadoBadge(s.estado)}</td>
      <td style="color:var(--text-light);font-size:0.79rem;white-space:nowrap;">${s.fecha}</td>
      <td style="font-size:0.8rem;color:${s.comentario?'var(--error)':'var(--text-light)'};">${s.comentario || '—'}</td>
    </tr>
  `).join('');
}
 
/** Aplica filtros (llamado desde onchange/oninput). */
function filtrarSolicitudes() { renderSolicitudesTable(); }
 
/** Limpia todos los filtros y re-renderiza. */
function limpiarFiltros() {
  document.getElementById('filter-tipo').value   = '';
  document.getElementById('filter-estado').value = '';
  document.getElementById('filter-radicado').value = '';
  renderSolicitudesTable();
}
 
/* ============================================================
   MÓDULO: PANEL ADMINISTRADOR
============================================================ */
 
/** Renderiza la tabla del panel admin con todas las solicitudes. */
function renderAdminTable() {
  const tbody = document.getElementById('admin-body');
  if (SOLICITUDES.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:var(--text-light);padding:24px;">Sin solicitudes.</td></tr>';
    return;
  }
  tbody.innerHTML = [...SOLICITUDES].reverse().map(s => `
    <tr>
      <td><strong>#${s.radicado}</strong></td>
      <td style="font-size:0.82rem;">${s.tipo}</td>
      <td>${s.cliente}</td>
      <td>${estadoBadge(s.estado)}</td>
      <td style="font-size:0.79rem;color:var(--text-light);">${s.fecha}</td>
      <td>
        <div class="flex gap-1">
          ${s.estado !== 'Gestionado' ? `<button class="btn btn-success btn-sm" onclick="cambiarEstado(${s.radicado},'Gestionado')" title="Marcar como gestionado">✓</button>` : ''}
          ${s.estado !== 'Rechazado'  ? `<button class="btn btn-danger btn-sm"  onclick="cambiarEstado(${s.radicado},'Rechazado')"  title="Rechazar solicitud">✕</button>` : ''}
          ${s.estado !== 'En gestión' ? `<button class="btn btn-secondary btn-sm" onclick="cambiarEstado(${s.radicado},'En gestión')" title="Poner en gestión">↺</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}
 
/**
 * Cambia el estado de una solicitud (solo admin).
 * @param {number} radicado
 * @param {string} nuevoEstado
 */
function cambiarEstado(radicado, nuevoEstado) {
  const idx = SOLICITUDES.findIndex(s => s.radicado === radicado);
  if (idx === -1) return;
  SOLICITUDES[idx].estado = nuevoEstado;
  renderAdminTable();
  updateDashboard();
  showToast(`Radicado #${radicado} → ${nuevoEstado}`, nuevoEstado === 'Gestionado' ? 'success' : 'info');
}
 
/**
 * Exporta las solicitudes a formato CSV (descarga simulada).
 */
function exportarCSV() {
  const headers = 'Radicado,Tipo,Cliente,ID,Poliza,Estado,Fecha\n';
  const rows = SOLICITUDES.map(s =>
    `${s.radicado},"${s.tipo}","${s.cliente}","${s.id}","${s.poliza}","${s.estado}","${s.fecha}"`
  ).join('\n');
  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'solicitudes_gestion_integral.csv';
  link.click();
  showToast('Exportación CSV generada', 'success');
}
 
/* ============================================================
   MÓDULO: PERFIL
============================================================ */
 
/** Rellena los campos del perfil con datos de sesión. */
function renderPerfil() {
  if (!SESSION) return;
  const initials = getInitials(SESSION.name);
  document.getElementById('prf-avatar').textContent      = initials;
  document.getElementById('prf-name').textContent        = SESSION.name;
  document.getElementById('prf-email').textContent       = SESSION.email;
  document.getElementById('prf-role').textContent        = SESSION.role;
  document.getElementById('prf-fullname').value          = SESSION.name;
  document.getElementById('prf-email-field').value       = SESSION.email;
  document.getElementById('prf-cod').value               = SESSION.cod;
  document.getElementById('prf-role-field').value        = SESSION.role;
}
 
/* ============================================================
   MÓDULO: SUBIDA DE ARCHIVOS (simulado)
============================================================ */
 
/** Almacén de archivos seleccionados por sección */
const FILES_STORE = {};
 
/**
 * Inicializa el área de drag & drop para un campo de archivos.
 * @param {string} areaId   - ID del div .upload-area
 * @param {string} inputId  - ID del input type=file
 * @param {string} listId   - ID del div .file-list
 */
function initUploadArea(areaId, inputId, listId) {
  const area  = document.getElementById(areaId);
  const input = document.getElementById(inputId);
  const list  = document.getElementById(listId);
  if (!area || !input || !list) return;
 
  FILES_STORE[listId] = [];
 
  // Click en área abre el selector de archivos
  area.addEventListener('click', () => input.click());
  area.addEventListener('keydown', e => { if (e.key === 'Enter') input.click(); });
 
  // Drag & drop
  area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('drag-over');
    handleFiles(Array.from(e.dataTransfer.files), listId);
  });
 
  // Input change
  input.addEventListener('change', () => {
    handleFiles(Array.from(input.files), listId);
    input.value = ''; // Reset para permitir re-selección
  });
}
 
/**
 * Procesa y muestra los archivos seleccionados.
 * @param {File[]} files
 * @param {string} listId
 */
function handleFiles(files, listId) {
  const list = document.getElementById(listId);
  if (!list) return;
 
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      showToast(`"${file.name}" supera 10 MB`, 'error');
      return;
    }
    FILES_STORE[listId] = FILES_STORE[listId] || [];
    FILES_STORE[listId].push(file);
  });
 
  renderFileList(listId);
}
 
/**
 * Renderiza la lista de archivos adjuntos.
 * @param {string} listId
 */
function renderFileList(listId) {
  const list = document.getElementById(listId);
  const files = FILES_STORE[listId] || [];
  if (files.length === 0) { list.innerHTML = ''; return; }
 
  list.innerHTML = files.map((f, i) => `
    <div class="file-item">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sura-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <span class="file-item-name">${f.name}</span>
      <span class="file-item-size">${formatSize(f.size)}</span>
      <button class="file-remove" onclick="removeFile('${listId}',${i})" aria-label="Eliminar archivo ${f.name}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');
}
 
/**
 * Elimina un archivo de la lista.
 * @param {string} listId
 * @param {number} idx
 */
function removeFile(listId, idx) {
  if (FILES_STORE[listId]) {
    FILES_STORE[listId].splice(idx, 1);
    renderFileList(listId);
  }
}
 
/**
 * Formatea el tamaño de un archivo.
 * @param {number} bytes
 * @returns {string}
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
}
 
/* ============================================================
   MÓDULO: FORMULARIO – RESET
============================================================ */
 
/**
 * Limpia un formulario y resetea su lista de archivos.
 * @param {string} formId
 * @param {string|null} fileListId
 * @param {string|null} fileInputId
 */
function resetForm(formId, fileListId, fileInputId) {
  const form = document.getElementById(formId);
  if (form) form.reset();
  if (fileListId) {
    FILES_STORE[fileListId] = [];
    renderFileList(fileListId);
  }
  // Re-prefill emails
  prefillEmails();
  // Limpiar errores
  form?.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  form?.querySelectorAll('.alert-error').forEach(el => el.classList.add('hidden'));
}
 
/* ============================================================
   MÓDULO: MODAL
============================================================ */
 
/**
 * Muestra el modal de confirmación/error.
 * @param {'success'|'error'} type
 * @param {string} title
 * @param {string} body
 * @param {number|null} radicado
 */
function showModal(type, title, body, radicado) {
  const backdrop = document.getElementById('modal-backdrop');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML    = body;
 
  const iconEl = document.getElementById('modal-icon');
  if (type === 'success') {
    iconEl.className = 'modal-icon modal-icon-success';
    iconEl.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else {
    iconEl.className = 'modal-icon modal-icon-error';
    iconEl.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  }
 
  const radEl = document.getElementById('modal-radicado');
  if (radicado) {
    document.getElementById('modal-num').textContent = `# ${radicado}`;
    radEl.style.display = 'block';
  } else {
    radEl.style.display = 'none';
  }
 
  backdrop.classList.remove('hidden');
  backdrop.focus();
}
 
/** Cierra el modal. */
function closeModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
}
 
/** Cierra el modal y navega a estado de solicitudes. */
function irAEstado() {
  closeModal();
  navigate('estado-solicitud');
}
 
// Cerrar modal al clic en backdrop
document.getElementById('modal-backdrop').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
 
// Cerrar modal con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
 
/* ============================================================
   MÓDULO: TOAST NOTIFICATIONS
============================================================ */
 
/**
 * Muestra una notificación toast.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;
  container.appendChild(toast);
 
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}
 
/* ============================================================
   MÓDULO: UTILIDADES UI
============================================================ */
 
/**
 * Devuelve el HTML de un badge de estado con el color adecuado.
 * @param {string} estado
 * @returns {string}
 */
function estadoBadge(estado) {
  const map = {
    'Gestionado': 'badge-green',
    'En gestión': 'badge-yellow',
    'Rechazado':  'badge-red',
  };
  return `<span class="badge ${map[estado] || 'badge-blue'}">${estado}</span>`;
}
 
/* ============================================================
   MÓDULO: RESPONSIVE – Ajuste de sidebar en resize
============================================================ */
window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024) {
    document.getElementById('app-sidebar').classList.remove('collapsed');
    document.getElementById('sidebar-overlay').classList.remove('active');
  } else {
    document.getElementById('app-sidebar').classList.add('collapsed');
  }
});
 
/* ============================================================
   INIT – Bootstrap de la aplicación
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // RECUPERAR SESIÓN AL RECARGAR
  // Si el usuario recarga la página se restaura la sesión
  // automáticamente sin necesidad de hacer login de nuevo
  // ============================================================
  const sesionGuardada = sessionStorage.getItem('session');
  if (sesionGuardada) {
    try {
      SESSION = JSON.parse(sesionGuardada);
      // Verificar que el usuario sigue siendo válido
      const usuarioValido = USERS.find(u => u.id === SESSION.id);
      if (usuarioValido) {
        startApp(); // Restaurar la app sin pasar por login
      } else {
        // Si el usuario no existe limpiar sesión
        sessionStorage.removeItem('session');
        SESSION = null;
      }
    } catch (e) {
      // Si hay error en el JSON limpiar sesión
      sessionStorage.removeItem('session');
      SESSION = null;
    }
  }

  // Inicializar módulos
  initLogin();
  initNav();

  // Inicializar áreas de upload para cada formulario
  initUploadArea('upload-leg',  'file-leg',  'files-leg');
  initUploadArea('upload-abo',  'file-abo',  'files-abo');
  initUploadArea('upload-cert', 'file-cert', 'files-cert');
  initUploadArea('upload-dol',  'file-dol',  'files-dol');
});
