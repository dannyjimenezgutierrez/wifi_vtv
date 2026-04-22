/**
 * CYBER ADMIN DASHBOARD - MAIN LOGIC
 * Handles menu navigation, sidebar toggling, stats counters, and matrix background.
 */
let mainTableInstance = null;
let perfilesTableInstance = null;
let gerenciasTableInstance = null;
let divisionesTableInstance = null;
const CYBER_TABLE_LANG = {
    url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
    emptyTable: "[ SISTEMA ] SIN REGISTROS DISPONIBLES EN ESTA SECCIÓN",
    zeroRecords: "[ BÚSQUEDA ] NO SE ENCONTRARON COINCIDENCIAS"
};

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initNavigation();
    initCatalogos();
    actualizarEstadisticas();
    actualizarEstadisticasPerfiles();
    initTable();
    initOtherTables();
    initMatrixBackground();
    initSearch();
    initTerminal();
    initSystemStats();
    initServidores();
    initInactividad();

    const btnTop = document.getElementById('btnTerminalTop');
    if (btnTop) {
        btnTop.addEventListener('click', () => {
            if (window.openTerminal) window.openTerminal('ADMIN');
        });
    }

    // --- GLOBAL BUTTON STATE HANDLER ---
    window.setBtnProcessing = function (btnId, isLoading, originalText = '[ GUARDAR REGISTRO ]') {
        const btn = typeof btnId === 'string' ? document.getElementById(btnId) : btnId;
        if (!btn) return;

        if (isLoading) {
            btn.disabled = true;
            btn.classList.add('btn-processing');
            btn.setAttribute('data-original-html', btn.innerHTML);
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation: spin 1s linear infinite; margin-right: 8px;">
                    <path d="M12 2v4m0 12v4m-7.07-15.07l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                </svg> [ PROCESANDO... ]
            `;
        } else {
            btn.disabled = false;
            btn.classList.remove('btn-processing');
            btn.innerHTML = btn.getAttribute('data-original-html') || originalText;
        }
    };
});

window.actualizarEstadisticasUbicaciones = function () {
    fetch('/api/ubicaciones/stats')
        .then(res => res.json())
        .then(response => {
            if (response.ok && response.data) {
                const s = response.data;
                const totalUbi = document.getElementById('statTotalUbicaciones');
                const totalPis = document.getElementById('statTotalPisos');

                if (totalUbi) {
                    totalUbi.setAttribute('data-target', s.total_ubicaciones || 0);
                    animateValue(totalUbi);
                }
                if (totalPis) {
                    totalPis.setAttribute('data-target', s.total_pisos || 0);
                    animateValue(totalPis);
                }
            }
        })
        .catch(err => console.error('[SYSTEM] Error actualizando estadísticas de ubicaciones:', err));
};

// --- SERVIDORES ---
function initServidores() {
    // Placeholder for future server list polling/management
    console.log("[SYSTEM] Servidores inicializados.");
}

window.quickSSH = (ip) => {
    window.showToast(`Iniciando conexión SSH con ${ip}...`);
    
    const platform = navigator.platform.toLowerCase();
    const isWindows = platform.indexOf('win') !== -1 || navigator.userAgent.toLowerCase().indexOf('windows') !== -1;
    
    if (isWindows) {
        window.showAlert('[ FALLO DEL SISTEMA ] SSH NATIVO SOLO DISPONIBLE EN LINUX.');
    } else {
        fetch(`/api/terminal/native?ip=${ip}`)
            .then(r => r.json())
            .then(data => {
                if (data.status === 'error') {
                    window.showAlert(data.message);
                    // Fallback a terminal web si falla nativo
                    if (window.openTerminal) window.openTerminal('ADMIN');
                }
            })
            .catch(() => {
                if (window.openTerminal) window.openTerminal('ADMIN');
            });
    }
};

// --- REAL SYSTEM STATS ---

function initSystemStats() {
    const cpuEl = document.getElementById('cpuVal');
    const ramEl = document.getElementById('ramVal');
    const tempEl = document.getElementById('amVal');

    function fetchStats() {
        // Generar datos simulados para evitar errores 404
        const data = {
            cpu: Math.floor(Math.random() * 20) + 10,
            ram: Math.floor(Math.random() * 30) + 40,
            temp: Math.floor(Math.random() * 10) + 35
        };
        if (cpuEl) cpuEl.textContent = data.cpu + '%';
        if (ramEl) ramEl.textContent = data.ram + '%';
        if (tempEl) tempEl.textContent = data.temp + '°C';
    }

    fetchStats();
    setInterval(fetchStats, 3000);
}



// --- USER DROPDOWN ---
(function () {
    const toggle = document.getElementById('userDropdownToggle');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle.classList.toggle('open');
        });
        document.addEventListener('click', () => {
            toggle.classList.remove('open');
        });
    }
})();

// --- NOTIFICATIONS ---
(function () {
    const wrap = document.getElementById('notifWrap');
    const btn = document.getElementById('btnNotif');
    const dot = document.getElementById('notifDot');
    const clear = document.getElementById('notifClear');
    const count = document.getElementById('notifCount');
    const list = document.getElementById('notifList');

    if (btn && wrap) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            wrap.classList.toggle('open');
        });
        document.addEventListener('click', () => {
            wrap.classList.remove('open');
        });
    }

    if (clear) {
        clear.addEventListener('click', () => {
            if (list) list.innerHTML = '<div style="padding:20px;text-align:center;color:#444;font-size:0.7rem;letter-spacing:2px;">// SIN_ALERTAS</div>';
            if (count) count.textContent = '0';
            if (dot) dot.classList.add('hidden');
        });
    }
})();

// --- MATRIX TOGGLE ---
(function () {
    const btn = document.getElementById('btnMatrix');
    let matrixOn = true;

    if (btn) {
        btn.addEventListener('click', () => {
            matrixOn = !matrixOn;
            const canvas = document.getElementById('matrixCanvas');
            if (canvas) {
                canvas.style.opacity = matrixOn ? '0.15' : '0';
            }
            btn.classList.toggle('matrix-off', !matrixOn);
            btn.title = matrixOn ? 'Apagar Matrix' : 'Encender Matrix';
        });
    }
})();



// --- SIDEBAR LOGIC ---
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');

    if (toggle && sidebar) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('collapsed');
            if (window.innerWidth <= 1024) {
                sidebar.classList.toggle('mobile-open');
            }
        });

        // Use ResizeObserver to adjust DataTables columns when sidebar changes size
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === sidebar && mainTableInstance) {
                    mainTableInstance.columns.adjust().draw();
                }
            }
        });
        resizeObserver.observe(sidebar);
    }

    // Close on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 &&
            sidebar.classList.contains('mobile-open') &&
            !sidebar.contains(e.target) &&
            !toggle.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });
}

// --- NAVIGATION LOGIC ---
function initNavigation() {
    // Dropdown Toggles
    const dropdowns = document.querySelectorAll('.nav-item-dropdown > .nav-item');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', (e) => {
            e.preventDefault();
            const parent = dropdown.parentElement;
            parent.classList.toggle('open');
            const submenu = parent.querySelector('.nav-submenu');
            if (submenu) {
                submenu.classList.toggle('open');
            }
        });
    });

    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.section');
    const mainBreadcrumb = document.getElementById('mainBreadcrumb');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.classList.contains('nav-logout')) return;
            e.preventDefault();

            const targetSec = item.getAttribute('data-section');

            // Update active states
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(sec => {
                sec.classList.remove('active');
                if (sec.id === `sec-${targetSec}`) {
                    sec.classList.add('active');
                }
            });

            // Update breadcrumb
            if (mainBreadcrumb) {
                mainBreadcrumb.textContent = targetSec.toUpperCase();
            }

            // [ REFRESH DATA ON NAVIGATION ]
            refreshModuleData(targetSec);

            // [ AUDITORIA ] Registrar cambio de sección
            if (window.registrarEventoAuditoria) registrarEventoAuditoria(targetSec);

            // Close mobile sidebar on navigation
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('mobile-open');
            }
        });
    });
}

function refreshModuleData(section) {
    console.log(`[SYSTEM] Refrescando módulo: ${section}`);

    switch (section) {
        case 'principal':
            actualizarEstadisticas();
            actualizarEstadisticasPerfiles();
            break;
        case 'usuarios':
            recargarTabla();
            actualizarEstadisticas();
            // Refrescar catálogos por si se crearon nuevos perfiles/gerencias
            initCatalogos();
            break;
        case 'perfiles':
            actualizarTablaPerfiles();
            actualizarEstadisticasPerfiles();
            break;
        case 'gerencias':
            actualizarTablaGerencias();
            break;
        case 'divisiones':
            actualizarTablaDivisiones();
            actualizarEstadisticasDivisiones();
            break;
        case 'marcas':
            actualizarTablaMarcas();
            actualizarEstadisticasMarcas();
            break;
        case 'ubicacion':
            actualizarTablaUbicaciones();
            actualizarEstadisticasUbicaciones();
            break;
        case 'wifi':
            if (!wifiCatalogos) cargarCatalogosWifi();
            actualizarTablaWifi();
            break;
        case 'auditoria-usuarios':
            actualizarTablaAuditoria();
            actualizarEstadisticasAuditoria(section);
            break;
        case 'auditoria-wifi':
            actualizarTablaAuditoriaWifi();
            actualizarEstadisticasAuditoria(section);
            break;
        case 'seguridad':
            // No se requiere carga inicial de datos por ahora
            break;
        default:
            // Por defecto, intentar actualizar estadísticas de sistema si existen
            if (window.actualizarEstadisticas) actualizarEstadisticas();
            break;
    }
}

window.animateValue = function (el) {
    const target = parseInt(el.getAttribute('data-target'));
    const duration = 1500;
    const start = 0;
    let startTime = null;

    const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = Math.floor(progress * (target - start) + start);

        el.textContent = current.toLocaleString();

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };

    window.requestAnimationFrame(step);
};

// --- STATS ANIMATION ---
function initStats() {
    const statValues = document.querySelectorAll('.stat-value[data-target]');

    // Use Intersection Observer for trigger
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateValue(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statValues.forEach(val => observer.observe(val));
}

// --- TABLE MOCK DATA & LOGIC ---
function initTable() {
    // ── CARGAR USUARIOS DESDE SQL SERVER ─────────────────────
    fetch('/api/usuarios')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                cargarTablaUsuarios(response.data);
            } else {
                console.error('Error cargando usuarios:', response.mensaje);
                cargarTablaUsuarios([]); // tabla vacía
            }
        })
        .catch(err => {
            console.error('Error de conexión:', err);
            cargarTablaUsuarios([]);
        });
}

function cargarTablaUsuarios(datos) {
    // 1. LIMPIEZA ROBUSTA: Si ya existe una instancia de DataTable, destruirla completamente
    if ($.fn.DataTable.isDataTable('#mainTable')) {
        $('#mainTable').DataTable().destroy();
        $('#mainTable').empty(); // Limpia el DOM para evitar basura
        // Re-crear HEADERS que empty() pudo haber borrado si no se tiene cuidado
        $('#mainTable').html(`
            <thead>
                <tr>
                    <th><input type="checkbox" class="cyber-check"></th>
                    <th>AVATAR</th>
                    <th>USUARIO</th>
                    <th>NOMBRE</th>
                    <th>APELLIDO</th>
                    <th>EMAIL</th>
                    <th>PERFIL</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                </tr>
            </thead>
            <tbody></tbody>
        `);
    }

    // Mapear campos de SQL Server al formato que espera DataTables
    const dataFormateada = datos.map(u => ({
        id: u.id,
        username: u.usuario,
        firstName: u.primer_nombre,
        lastName: u.primer_apellido,
        email: u.correo || 'Sin correo',
        profile: u.perfil || 'USUARIO',
        status: u.estado || 'ACTIVO',
        foto_perfil: u.foto_perfil || '/static/Principal/img/default_avatar.png'
    }));

    mainTableInstance = $('#mainTable').DataTable({
        data: dataFormateada,
        columns: [
            {
                data: null,
                defaultContent: '<input type="checkbox" class="cyber-check">',
                orderable: false,
                searchable: false,
                width: '30px'
            },
            {
                data: 'foto_perfil',
                orderable: false,
                searchable: false,
                render: (data, type, row) => {
                    return `<img src="${data}" width="50" height="50" style="border-radius: 50%; object-fit: cover; border: 1.5px solid #00ff41;" onerror="this.onerror=null;this.src='/static/Principal/img/default_avatar.png';">`;
                }
            },
            {
                data: 'username',
                render: (data) => `<span class="font-bold text-green">${data}</span>`
            },
            {
                data: 'firstName',
                render: (data) => `<span class="font-mono">${data}</span>`
            },
            {
                data: 'lastName',
                render: (data) => `<span class="font-mono">${data}</span>`
            },
            {
                data: 'email',
                render: (data) => `<span class="font-mono text-small">${data}</span>`
            },
            {
                data: 'profile',
                render: (data) => {
                    const profileClass = `profile-${data.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                    const hasSpecificClass = ['profile-root', 'profile-administrador', 'profile-tecnico', 'profile-seguridad'].includes(profileClass);
                    const finalClass = hasSpecificClass ? profileClass : 'profile-default';
                    return `<span class="profile-badge ${finalClass}">${data}</span>`;
                }
            },
            {
                data: 'status',
                render: (data) => `<span class="status-badge status-${data.toLowerCase()}">${data}</span>`
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (data, type, row) => `
                    <div class="row-actions">
                        <button class="btn btn-outline btn-sm" title="Ver"
                            onclick="viewRecord(${row.id})">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M10.5 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/>
                            </svg>
                        </button>
                        <button class="btn btn-outline btn-sm btn-outline-blue" title="Editar"
                            onclick="editRecord(${row.id})">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10z"/>
                            </svg>
                        </button>
                        <button class="btn btn-outline btn-sm btn-outline-red" title="Eliminar"
                            onclick="deleteRecord(${row.id}, '${row.username}')">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1z"/>
                            </svg>
                        </button>
                    </div>
                `
            }
        ],
        language: CYBER_TABLE_LANG,
        pageLength: 6,
        lengthMenu: [6, 10, 25, 100],
        autoWidth: false,
        responsive: true,
        dom: '<"top"fl>rt<"bottom"ip><"clear">'
    });
}

function initOtherTables() {
    if ($('#perfilesTable').length) {
        fetch('/api/perfiles')
            .then(res => res.json())
            .then(response => {
                if (response.ok) {
                    cargarTablaPerfiles(response.data);
                } else {
                    console.error('Error cargando perfiles:', response.mensaje);
                    cargarTablaPerfiles([]);
                }
            })
            .catch(err => {
                console.error('Error de conexión:', err);
                cargarTablaPerfiles([]);
            });
    }

    // Gerencias Table Initialization removed - handled by cargarTablaGerencias()

    if ($('#divisionesTable').length) {
        actualizarTablaDivisiones();
    }

    if ($('#marcasTable').length) {
        actualizarTablaMarcas();
    }

    if ($('#ubicacionTable').length) {
        actualizarTablaUbicaciones();
    }

    if ($('#wifiTable').length) {
        if (!wifiCatalogos) cargarCatalogosWifi();
        actualizarTablaWifi();
    }

    if ($('#auditoriaWifiTable').length) {
        actualizarTablaAuditoriaWifi();
    }
}

// --- MATRIX BACKGROUND EFFECT ---
function initMatrixBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'matrixCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    canvas.style.opacity = '0.15';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"\'#&_(),.;:?!\\|{}<>[]";
    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    const drops = new Array(columns).fill(1);

    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#00ff41';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    let interval = setInterval(draw, 33);

    window.addEventListener('resize', () => {
        clearInterval(interval);
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        const newCols = Math.floor(width / fontSize);
        drops.length = 0;
        for (let i = 0; i < newCols; i++) drops[i] = 1;
        interval = setInterval(draw, 33);
    });
}

// --- GLOBAL SEARCH ---
function initSearch() {
    const globalSearches = document.querySelectorAll('#globalSearch');
    const tableSearches = document.querySelectorAll('#tableSearch');

    function performSearch(val) {
        globalSearches.forEach(s => s.value = val);
        tableSearches.forEach(s => s.value = val);

        // Buscar en todas las instancias de DataTables activas
        if ($.fn.DataTable.isDataTable('#mainTable')) {
            $('#mainTable').DataTable().search(val).draw();
        }
        if ($.fn.DataTable.isDataTable('#perfilesTable')) {
            $('#perfilesTable').DataTable().search(val).draw();
        }
        if ($.fn.DataTable.isDataTable('#gerenciasTable')) {
            $('#gerenciasTable').DataTable().search(val).draw();
        }
        if ($.fn.DataTable.isDataTable('#divisionesTable')) {
            $('#divisionesTable').DataTable().search(val).draw();
        }
        if ($.fn.DataTable.isDataTable('#marcasTable')) {
            $('#marcasTable').DataTable().search(val).draw();
        }
        if ($.fn.DataTable.isDataTable('#ubicacionTable')) {
            $('#ubicacionTable').DataTable().search(val).draw();
        }
        if ($.fn.DataTable.isDataTable('#wifiTable')) {
            $('#wifiTable').DataTable().search(val).draw();
        }
        if ($.fn.DataTable.isDataTable('#auditoriaTable')) {
            $('#auditoriaTable').DataTable().search(val).draw();
        }
        if ($.fn.DataTable.isDataTable('#auditoriaWifiTable')) {
            $('#auditoriaWifiTable').DataTable().search(val).draw();
        }
    }

    globalSearches.forEach(gs => {
        gs.addEventListener('input', (e) => performSearch(e.target.value));
    });
    tableSearches.forEach(ts => {
        ts.addEventListener('input', (e) => performSearch(e.target.value));
    });
}

// --- SEGURIDAD Y ALERTAS ---
function glitch() {
    const gov = document.getElementById('glitchOverlay');
    if (gov) {
        requestAnimationFrame(() => {
            gov.classList.remove('fire');
            void gov.offsetWidth; // Trigger reflow
            gov.classList.add('fire');
        });
    }
}

window.showAlert = (msg) => {
    const msgEl = document.getElementById('alertMessage');
    const modal = document.getElementById('modalAlert');
    if (msgEl) msgEl.textContent = msg;

    glitch(); // Efecto de interferencia antes de mostrar

    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
};

window.closeAlert = () => {
    const modal = document.getElementById('modalAlert');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 400);
    }
};

// Bloqueo de Inspector (F12 / Clic Derecho)
document.addEventListener('contextmenu', e => {
    e.preventDefault();
    window.showAlert('[ ACCESO RESTRINGIDO ] EL MENÚ CONTEXTUAL HA SIDO DESACTIVADO POR SEGURIDAD.');
});

document.addEventListener('keydown', e => {
    if (
        e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
        (e.ctrlKey && e.keyCode === 85)
    ) {
        e.preventDefault();
        window.showAlert('[ ALERTA DE SEGURIDAD ] EL ACCESO A LAS HERRAMIENTAS DE DESARROLLADOR ESTÁ RESTRINGIDO.');
    }

    // Toggle Terminal Shortcut: Ctrl + T
    if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        if (window.toggleTerminal) window.toggleTerminal();
    }
});

// --- MODAL HELPERS ---
window.showModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
        // Cerrar otros modales abiertos para evitar solapamientos
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            if (m.id !== id) m.classList.remove('active');
        });

        modal.style.display = 'flex';
        // Forzar un reflow para que la animación funcione siempre
        void modal.offsetWidth;

        setTimeout(() => modal.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';

        // Reset image if it's the create modal
        if (id === 'modalCrearUsuarios') {
            window.currentProfileImageBase64 = null;
            const preview = document.getElementById('fFotoPreview');
            if (preview) {
                preview.src = '/static/Principal/img/default_avatar.png';
                preview.classList.add('avatar-green-matrix');
            }
            const input = document.getElementById('fFoto');
            if (input) input.value = '';
        }
    }
};

window.currentProfileImageBase64 = null;

window.previewImage = (input, previewId) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 2 * 1024 * 1024) {
            showAlert("La imagen no debe superar los 2MB.");
            input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.src = e.target.result;
                preview.classList.remove('avatar-green-matrix');
            }
            window.currentProfileImageBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        modal.classList.remove('show');

        // Solo restaurar scroll si no quedan modales activos
        setTimeout(() => {
            modal.style.display = 'none';
            const anyActive = document.querySelector('.modal-overlay.active');
            if (!anyActive) {
                document.body.style.overflow = '';
            }
        }, 400);
    }
};

window.closeOnOverlay = (e, id) => {
    if (e.target.id === id) closeModal(id);
};

// --- TAB SYSTEM ---
window.switchTab = (tabId, modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Deactivate all tabs in this modal
    const tabs = modal.querySelectorAll('.modal-tab');
    tabs.forEach(t => t.classList.remove('active'));

    // Deactivate all panels in this modal
    const panels = modal.querySelectorAll('.tab-panel');
    panels.forEach(p => p.classList.remove('active'));

    // Activate clicked tab
    // We search for the tab that has the specific tabId in its onclick attribute
    const targetTab = Array.from(tabs).find(t => t.getAttribute('onclick').includes(`'${tabId}'`));
    if (targetTab) targetTab.classList.add('active');

    // Activate target panel
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) targetPanel.classList.add('active');
};


// --- CRUD PLACEHOLDERS ---
// ── VER REGISTRO ──────────────────────────────────────────────
window.viewRecord = (id) => {
    fetch(`/api/usuarios/${id}`)
        .then(res => res.json())
        .then(r => {
            if (!r.ok) return;
            const u = r.data;
            switchTab('vtabPersonal', 'modalView');
            const fotoDest = document.getElementById('vFotoPreview');
            if (fotoDest) {
                const fotoSrc = u.foto_perfil || '/static/Principal/img/default_avatar.png';
                fotoDest.src = fotoSrc;
                const isDefault = fotoSrc.toLowerCase().includes('default_avatar');
                fotoDest.classList.toggle('avatar-green-matrix', isDefault);
            }

            setValue('vFirstName', u.primer_nombre);
            setValue('vLastName', u.primer_apellido);
            setValue('vUsername', u.usuario);
            setValue('vCedula', u.cedula);
            setValue('vPhone', u.telefono);
            setValue('vProfile', u.id_perfil);
            setValue('vStatus', u.id_estado);
            setValue('vGerencia', u.id_gerencia);

            const divUrl = u.id_gerencia ? `/api/divisiones?id_gerencia=${u.id_gerencia}` : '/api/divisiones';
            cargarSelectDesdeApi(divUrl, ['vDivision'], 'id', 'nombre').then(() => {
                setValue('vDivision', u.id_division);
            });

            setValue('vEmail', u.correo);
            setValue('vPassword', u.clave);
            window.currentViewId = id;
            showModal('modalView');
        });
};

window.editFromView = () => {
    closeModal('modalView');
    if (window.currentViewId) {
        editRecord(window.currentViewId);
    }
};

// ── EDITAR REGISTRO ───────────────────────────────────────────
window.editRecord = (id) => {
    fetch(`/api/usuarios/${id}`)
        .then(res => res.json())
        .then(r => {
            if (!r.ok) return;
            const u = r.data;

            window.currentProfileImageBase64 = null;
            const fotoDest = document.getElementById('eFotoPreview');
            if (fotoDest) {
                const fotoSrc = u.foto_perfil || '/static/Principal/img/default_avatar.png';
                fotoDest.src = fotoSrc;
                const isDefault = fotoSrc.toLowerCase().includes('default_avatar');
                fotoDest.classList.toggle('avatar-green-matrix', isDefault);
            }
            const fInput = document.getElementById('eFoto');
            if (fInput) fInput.value = '';

            setValue('eEditId', u.id);
            setValue('eFirstName', u.primer_nombre);
            setValue('eSecondName', u.segundo_nombre);
            setValue('eLastName', u.primer_apellido);
            setValue('eSecondLastName', u.segundo_apellido);
            setValue('eUsername', u.usuario);
            setValue('eCedula', u.cedula);
            setValue('ePhone', u.telefono);
            setValue('eProfile', u.id_perfil);
            setValue('eStatus', u.id_estado);
            setValue('eGerencia', u.id_gerencia);

            const divUrl = u.id_gerencia ? `/api/divisiones?id_gerencia=${u.id_gerencia}` : '/api/divisiones';
            cargarSelectDesdeApi(divUrl, ['eDivision'], 'id', 'nombre').then(() => {
                setValue('eDivision', u.id_division);
            });

            setValue('eEmail', u.correo);
            setValue('ePassword', u.clave); // Mostrar clave actual en edición
            showModal('modalEditarUsuarios');
        });
};

// ── GUARDAR NUEVO ─────────────────────────────────────────────
window.saveRecord = () => {
    const fFirstName = getVal('fFirstName');
    const fLastName = getVal('fLastName');
    const fSecondName = getVal('fSecondName');
    const fSecondLastName = getVal('fSecondLastName');
    const fCedula = getVal('fCedula');
    const fPhone = getVal('fPhone');
    const fEmail = getVal('fEmail');
    const fUsername = getVal('fUsername');
    const fPassword = getVal('fPassword');

    let error = validarNombre(fFirstName, 'EL PRIMER NOMBRE');
    if (error) { showAlert(error); return; }

    error = validarNombre(fLastName, 'EL PRIMER APELLIDO');
    if (error) { showAlert(error); return; }

    if (fSecondName) {
        error = validarNombre(fSecondName, 'EL SEGUNDO NOMBRE');
        if (error) { showAlert(error); return; }
    }
    if (fSecondLastName) {
        error = validarNombre(fSecondLastName, 'EL SEGUNDO APELLIDO');
        if (error) { showAlert(error); return; }
    }

    error = validarCedula(fCedula);
    if (error) { showAlert(error); return; }

    error = validarTelefono(fPhone);
    if (error) { showAlert(error); return; }

    error = validarCorreo(fEmail);
    if (error) { showAlert(error); return; }

    error = validarUsername(fUsername);
    if (error) { showAlert(error); return; }

    error = validarPassword(fPassword);
    if (error) { showAlert(error); return; }

    const fProfile = getVal('fProfile');
    const fGerencia = getVal('fGerencia');
    const fDivision = getVal('fDivision');

    error = validarSelect(fProfile, 'EL PERFIL SISTEMA');
    if (error) { showAlert(error); return; }

    error = validarSelect(fGerencia, 'LA GERENCIA');
    if (error) { showAlert(error); return; }

    error = validarSelect(fDivision, 'LA DIVISIÓN');
    if (error) { showAlert(error); return; }

    const datos = {
        primer_nombre: fFirstName,
        segundo_nombre: fSecondName,
        primer_apellido: fLastName,
        segundo_apellido: fSecondLastName,
        usuario: getVal('fUsername'),
        clave: getVal('fPassword'),
        cedula: fCedula,
        telefono: fPhone,
        correo: fEmail,
        id_perfil: fProfile,
        id_estado: 1, // Por defecto activo al crear
        id_gerencia: fGerencia,
        id_division: fDivision,
    };

    if (window.currentProfileImageBase64) {
        datos.foto_perfil = window.currentProfileImageBase64;
    }

    const btn = document.getElementById('btnSaveUser');
    window.setBtnProcessing(btn, true);

    fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(res => res.json())
        .then(r => {
            window.setBtnProcessing(btn, false);
            if (r.ok) {
                closeModal('modalCrearUsuarios');
                // Recargar datos en segundo plano inmediatamente
                recargarTabla();
                actualizarEstadisticas();
                // Mostrar alerta después de cerrar el modal para mayor fluidez
                setTimeout(() => showAlert('✅ Registro guardado correctamente.'), 100);
            } else {
                showAlert(r.mensaje);
            }
        })
        .catch(err => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión con el servidor.');
        });
};

// ── ACTUALIZAR ────────────────────────────────────────────────
window.updateRecord = () => {
    const id = getVal('eEditId');
    const eFirstName = getVal('eFirstName');
    const eLastName = getVal('eLastName');
    const eSecondName = getVal('eSecondName');
    const eSecondLastName = getVal('eSecondLastName');
    const eCedula = getVal('eCedula');
    const ePhone = getVal('ePhone');
    const eEmail = getVal('eEmail');
    const eUsername = getVal('eUsername');
    const ePassword = getVal('ePassword');

    let error = validarNombre(eFirstName, 'EL PRIMER NOMBRE');
    if (error) { showAlert(error); return; }

    error = validarNombre(eLastName, 'EL PRIMER APELLIDO');
    if (error) { showAlert(error); return; }

    if (eSecondName) {
        error = validarNombre(eSecondName, 'EL SEGUNDO NOMBRE');
        if (error) { showAlert(error); return; }
    }
    if (eSecondLastName) {
        error = validarNombre(eSecondLastName, 'EL SEGUNDO APELLIDO');
        if (error) { showAlert(error); return; }
    }

    error = validarCedula(eCedula);
    if (error) { showAlert(error); return; }

    error = validarTelefono(ePhone);
    if (error) { showAlert(error); return; }

    error = validarCorreo(eEmail);
    if (error) { showAlert(error); return; }

    error = validarUsername(eUsername);
    if (error) { showAlert(error); return; }

    // La clave solo se valida si se escribe algo (es opcional en edición)
    if (ePassword && ePassword !== '') {
        error = validarPassword(ePassword);
        if (error) { showAlert(error); return; }
    }

    const eProfile = getVal('eProfile');
    const eStatus = getVal('eStatus');
    const eGerencia = getVal('eGerencia');
    const eDivision = getVal('eDivision');

    error = validarSelect(eProfile, 'EL PERFIL SISTEMA');
    if (error) { showAlert(error); return; }

    error = validarSelect(eStatus, 'EL ESTADO');
    if (error) { showAlert(error); return; }

    error = validarSelect(eGerencia, 'LA GERENCIA');
    if (error) { showAlert(error); return; }

    error = validarSelect(eDivision, 'LA DIVISIÓN');
    if (error) { showAlert(error); return; }

    const datos = {
        primer_nombre: eFirstName,
        segundo_nombre: eSecondName,
        primer_apellido: eLastName,
        segundo_apellido: eSecondLastName,
        usuario: eUsername,
        cedula: eCedula,
        telefono: ePhone,
        correo: eEmail,
        id_perfil: eProfile,
        id_estado: eStatus,
        id_gerencia: eGerencia,
        id_division: eDivision,
    };

    if (window.currentProfileImageBase64) {
        datos.foto_perfil = window.currentProfileImageBase64;
    }

    if (ePassword && ePassword !== '') {
        datos.clave = ePassword;
    }

    const btn = document.getElementById('btnUpdateUser');
    window.setBtnProcessing(btn, true);

    fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(res => res.json())
        .then(r => {
            window.setBtnProcessing(btn, false);
            if (r.ok) {
                closeModal('modalEditarUsuarios');
                recargarTabla();
                actualizarEstadisticas();
                setTimeout(() => showAlert('✅ Registro actualizado correctamente.'), 100);
            } else {
                showAlert(r.mensaje);
            }
        })
        .catch(err => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión con el servidor.');
        });
};

// ── ELIMINAR ──────────────────────────────────────────────────
window.deleteRecord = (id, nombre) => {
    window.currentDeleteId = id;
    const target = document.getElementById('deleteTarget');
    if (target) target.textContent = nombre;

    // Configurar foto a eliminar buscando en tableData
    let currentPhoto = '/static/Principal/img/default_avatar.png';
    if (mainTableInstance) {
        const rowData = mainTableInstance.rows().data().toArray();
        const found = rowData.find(u => u.id === id);
        if (found && found.foto_perfil) {
            currentPhoto = found.foto_perfil;
        }
    }
    const dPhoto = document.getElementById('dFotoPreview');
    if (dPhoto) {
        dPhoto.src = currentPhoto;
        const isDefault = currentPhoto.toLowerCase().includes('default_avatar');
        dPhoto.classList.toggle('avatar-green-matrix', isDefault);
    }

    showModal('modalEliminarUsuarios');
};

window.confirmDelete = () => {
    const id = window.currentDeleteId;
    const btn = document.getElementById('btnConfirmDelete');
    window.setBtnProcessing(btn, true);

    fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(r => {
            if (r.ok) {
                closeModal('modalEliminarUsuarios');
                recargarTabla();
                actualizarEstadisticas();
                setTimeout(() => showAlert('✅ Registro eliminado correctamente.', 'SUCCESS'), 100);
            } else {
                showAlert(r.mensaje);
            }
        })
        .catch(err => {
            showAlert('Error de conexión con el servidor.');
        })
        .finally(() => {
            window.setBtnProcessing(btn, false, 'ELIMINAR');
        });
};

// ── HELPERS ───────────────────────────────────────────────────
function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
}





function validarNombre(val, label) {
    if (!val || val.trim() === '') return `${label} no puede estar vacío.`;
    if (val.length < 3) return `${label} debe tener al menos 3 caracteres.`;
    if (val.length > 16) return `${label} no puede tener más de 16 caracteres.`;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(val)) return `${label} solo puede contener letras.`;
    return null;
}

window.togglePassword = (inputId, iconId) => {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    const isShowing = input.type === 'text';

    input.type = isShowing ? 'password' : 'text';

    // SVG Eye (Open)
    const eyeOpen = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>`;

    // SVG Eye-Off (Closed)
    const eyeClosed = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>`;

    icon.innerHTML = isShowing ? eyeOpen : eyeClosed;
};

function validarCedula(val) {
    if (!val || val.trim() === '') return 'La CÉDULA no puede estar vacía.';
    const regex = /^\d{6,8}$/;
    if (!regex.test(val)) return 'La CÉDULA debe ser solo números (6 a 8 dígitos).';
    return null;
}

function validarTelefono(val) {
    if (!val || val.trim() === '') return 'El TELÉFONO no puede estar vacío.';
    const regex = /^04(12|14|16|22|24|26)\d{7}$/;
    if (!regex.test(val)) return 'Formato de TELÉFONO inválido (Ej: 04140000000).';
    return null;
}

function validarCorreo(val) {
    if (!val || val.trim() === '') return 'El CORREO ELECTRÓNICO no puede estar vacío.';
    const regex = /^[a-zA-Z0-9._%+-]+@vtv\.gob\.ve$/;
    if (!regex.test(val)) return 'Debe ser un correo institucional (@vtv.gob.ve).';
    return null;
}

function validarSelect(val, label) {
    if (!val || val === '' || val === '0') return `Debe seleccionar una opción en ${label}.`;
    return null;
}

function validarUsername(val) {
    if (!val || val.trim() === '') return 'El NOMBRE DE USUARIO no puede estar vacío.';
    const regex = /^[a-zA-Z]{3,16}$/;
    if (!regex.test(val)) return 'El USUARIO solo puede contener letras (3 a 16 caracteres).';
    return null;
}

function validarPassword(val) {
    if (!val || val.trim() === '') return 'La CONTRASEÑA no puede estar vacía.';
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
    if (!regex.test(val)) return 'La CONTRASEÑA debe tener entre 8 y 16 caracteres, incluir mayúscula, minúscula, número y un símbolo (@$!%*?&).';
    return null;
}

// ── CATALOGOS DINAMICOS ───────────────────────────────────────
window.actualizarEstadisticasAuditoria = function (modulo) {
    if (modulo === 'auditoria-usuarios') {
        fetch('/api/auditoria/stats')
            .then(res => res.json())
            .then(response => {
                if (response.ok && response.data) {
                    const s = response.data;
                    const evHoy = document.getElementById('statsAuditoriaEventos');
                    const userActivos = document.getElementById('statsAuditoriaUsersActivos');
                    const alertas = document.getElementById('statsAuditoriaAlertas');
                    const totalLogs = document.getElementById('statsAuditoriaTotal');

                    if (evHoy) { evHoy.setAttribute('data-target', s.eventos_hoy || 0); animateValue(evHoy); }
                    if (userActivos) { userActivos.setAttribute('data-target', s.usuarios_activos || 0); animateValue(userActivos); }
                    if (alertas) { alertas.setAttribute('data-target', s.alertas || 0); animateValue(alertas); }
                    if (totalLogs) { totalLogs.setAttribute('data-target', s.total_historico || 0); animateValue(totalLogs); }
                }
            })
            .catch(err => console.error('[SYSTEM] Error actualizando stats auditoria:', err));
    } else if (modulo === 'auditoria-wifi') {
        fetch('/api/auditoria/wifi/stats')
            .then(res => res.json())
            .then(response => {
                if (response.ok && response.data) {
                    const s = response.data;
                    const cambios = document.getElementById('statsAuditoriaWifiCambios');
                    const aps = document.getElementById('statsAuditoriaWifiAPs');
                    const alertas = document.getElementById('statsAuditoriaWifiAlertas');
                    const totalLogs = document.getElementById('statsAuditoriaWifiTotal');

                    if (cambios) { cambios.setAttribute('data-target', s.cambios_hoy || 0); animateValue(cambios); }
                    if (aps) { aps.setAttribute('data-target', s.aps_monitoreados || 0); animateValue(aps); }
                    if (alertas) { alertas.setAttribute('data-target', s.alertas || 0); animateValue(alertas); }
                    if (totalLogs) { totalLogs.setAttribute('data-target', s.total_historico || 0); animateValue(totalLogs); }
                }
            })
            .catch(err => console.error('[SYSTEM] Error actualizando stats auditoria wifi:', err));
    }
};

window.actualizarTablaAuditoriaWifi = function () {
    fetch('/api/auditoria/wifi')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                renderizarTablaAuditoriaWifi(response.data);
            }
        })
        .catch(err => console.error('[SYSTEM] Error cargando auditoria wifi:', err));
};

function renderizarTablaAuditoriaWifi(datos) {
    if ($.fn.DataTable.isDataTable('#auditoriaWifiTable')) {
        $('#auditoriaWifiTable').DataTable().destroy();
        $('#auditoriaWifiTable tbody').empty();
    }

    $('#auditoriaWifiTable').DataTable({
        data: datos,
        columns: [
            {
                data: null,
                defaultContent: '<input type="checkbox" class="cyber-check">',
                orderable: false,
                searchable: false,
                width: '30px'
            },
            { data: 'id', render: (d) => `<span class="font-mono text-small">#${d}</span>` },
            { data: 'ssid', render: (d) => `<span class="text-green font-bold">${d}</span>` },
            {
                data: 'accion', render: (d) => {
                    const map = { 'registro': 'REGISTRO', 'edicion': 'EDICIÓN', 'eliminacion': 'ELIMINACIÓN' };
                    const label = map[d] || d.toUpperCase();
                    return `<span class="badge badge-info">${label}</span>`;
                }
            },
            {
                data: 'estado', render: (d) => {
                    const label = d === 'activo' ? 'EXITOSO' : 'FALLIDO';
                    const cls = d === 'activo' ? 'status-success' : 'status-failure';
                    return `<span class="status-badge ${cls}">${label}</span>`;
                }
            },
            { data: 'usuario', render: (d) => `<span class="font-bold">${d}</span>` },
            { data: 'fecha' },
            { data: 'hora' },
            { data: 'ip', render: (d) => `<span class="font-mono text-small">${d}</span>` }
        ],
        language: CYBER_TABLE_LANG,
        pageLength: 10,
        order: [[1, 'desc']],
        deferRender: true, // Optimización para fluidez
        autoWidth: false,
        responsive: true,
        dom: '<"top"fl>rt<"bottom"ip><"clear">'
    });
}

window.actualizarTablaAuditoria = function () {
    fetch('/api/auditoria/usuarios')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                renderizarTablaAuditoria(response.data);
            }
        })
        .catch(err => console.error('[SYSTEM] Error cargando auditoria:', err));
};

function renderizarTablaAuditoria(datos) {
    if ($.fn.DataTable.isDataTable('#auditoriaTable')) {
        $('#auditoriaTable').DataTable().destroy();
        $('#auditoriaTable tbody').empty();
    }

    $('#auditoriaTable').DataTable({
        data: datos,
        columns: [
            {
                data: null,
                defaultContent: '<input type="checkbox" class="cyber-check">',
                orderable: false,
                searchable: false,
                width: '30px'
            },
            { data: 'id', render: (d) => `<span class="font-mono text-small">#${d}</span>` },
            { data: 'usuario', render: (d) => `<span class="text-green font-bold">${d}</span>` },
            { data: 'modulo', render: (d) => `<span class="badge badge-info">${d}</span>` },
            { 
                data: 'ip', 
                render: (d) => d ? `<a href="http://${d}" target="_blank" class="ip-link-btn" title="ABRIR INTERFAZ WEB [ http://${d} ]">${d}</a>` : '<span class="text-muted">--</span>' 
            },
            { data: 'fecha' },
            { data: 'hora_entrada' },
            { data: 'hora_salida', render: (d) => d ? `<span class="text-yellow">${d}</span>` : '<span class="text-muted">--:--:--</span>' },
            { data: 'navegador', render: (d) => `<span class="font-mono text-small" title="${d}">${d ? d.substring(0, 30) + '...' : ''}</span>` }
        ],
        language: CYBER_TABLE_LANG,
        pageLength: 10,
        order: [[1, 'desc']],
        autoWidth: false,
        responsive: true,
        dom: '<"top"fl>rt<"bottom"ip><"clear">'
    });
}

window.registrarEventoAuditoria = function (targetSec) {
    const map = {
        'principal': 'principal',
        'wifi': 'perifericos/wifi',
        'ubicacion': 'perifericos/ubicacion',
        'marcas': 'perifericos/marcas',
        'divisiones': 'configuracion/divisiones',
        'gerencias': 'configuracion/gerencias',
        'perfiles': 'configuracion/perfiles',
        'usuarios': 'configuracion/usuarios',
        'auditoria-usuarios': 'auditoria/usuarios',
        'auditoria-wifi': 'auditoria/wifi'
    };

    const modulo = map[targetSec] || 'principal';

    fetch('/api/auditoria/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulo: modulo })
    }).catch(err => console.error('[SYSTEM] Error registrando auditoría:', err));
};

function initCatalogos() {
    cargarSelectDesdeApi('/api/perfiles', ['fProfile', 'eProfile', 'vProfile'], 'id', 'nombre');
    cargarSelectDesdeApi('/api/gerencias', ['fGerencia', 'eGerencia', 'vGerencia', 'dGerencia', 'editDGerencia'], 'id', 'nombre');
    cargarSelectDesdeApi('/api/divisiones', ['fDivision', 'eDivision', 'vDivision'], 'id', 'nombre');

    cargarSelectDesdeApi('/api/estados', ['fStatus', 'eStatus', 'vStatus'], 'id', 'nombre')
        .then(() => {
            const fStatus = document.getElementById('fStatus');
            if (fStatus) {
                fStatus.value = '1'; // "ACTIVO"
            }
        });

    // Listeners para selectores dependientes (Gerencia -> Division)
    setupGerenciaListener('fGerencia', 'fDivision');
    setupGerenciaListener('eGerencia', 'eDivision');
    setupGerenciaListener('vGerencia', 'vDivision');
}

function setupGerenciaListener(gId, dId) {
    const gEl = document.getElementById(gId);
    if (gEl) {
        gEl.addEventListener('change', () => {
            const val = gEl.value;
            const url = val ? `/api/divisiones?id_gerencia=${val}` : '/api/divisiones';
            cargarSelectDesdeApi(url, [dId], 'id', 'nombre');
        });
    }
}

function cargarSelectDesdeApi(url, selectIds, valueKey, textKey) {
    return fetch(url)
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                selectIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        const firstOption = el.options[0];
                        el.innerHTML = '';
                        if (firstOption && (firstOption.value === "" || firstOption.text.includes("Seleccione"))) {
                            el.appendChild(firstOption);
                        }

                        response.data.forEach(item => {
                            const opt = document.createElement('option');
                            opt.value = item[valueKey];
                            opt.textContent = item[textKey].toUpperCase();
                            el.appendChild(opt);
                        });
                    }
                });
            }
            return response;
        });
}

function recargarTabla() {
    fetch('/api/usuarios')
        .then(res => res.json())
        .then(response => {
            if (response.ok && mainTableInstance) {
                const dataFormateada = response.data.map(u => ({
                    id: u.id,
                    username: u.usuario,
                    firstName: u.primer_nombre,
                    lastName: u.primer_apellido,
                    email: u.correo || 'Sin correo',
                    status: u.estado || 'ACTIVO',
                    foto_perfil: u.foto_perfil || '/static/Principal/img/default_avatar.png'
                }));
                mainTableInstance.clear().rows.add(dataFormateada).draw();
            } else {
                // Si no hay instancia, recrear desde cero
                if ($.fn.DataTable.isDataTable('#mainTable')) {
                    $('#mainTable').DataTable().destroy();
                }
                mainTableInstance = null;
                initTable();
            }
        })
        .catch(err => {
            console.error("[SYSTEM] Error al recargar tabla:", err);
            initTable();
        });
}


function actualizarEstadisticas() {
    // 1. Estadísticas de Usuarios (Existentes)
    fetch('/api/usuarios/stats')
        .then(res => res.json())
        .then(r => {
            if (r.ok && r.data) {
                const s = r.data;
                const updateStat = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.setAttribute('data-target', val);
                        animateValue(el);
                    }
                };
                updateStat('statActivos', s.activos || 0);
                updateStat('statInactivos', s.inactivos || 0);
                updateStat('statBloqueados', s.bloqueados || 0);
                updateStat('statTotal', s.total || 0);
            }
        });

    // 2. Estadísticas de Principal (Home)
    // Estas son métricas de sistema/infraestructura. Usamos mock/calculados para el "feel" Cyber.
    const updateHomeStat = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute('data-target', val);
            animateValue(el);
        }
    };

    updateHomeStat('statsHomeNodes', 142);
    updateHomeStat('statsHomeTraffic', 845);
    updateHomeStat('statsHomeThreats', 15);
    updateHomeStat('statsHomeUptime', 99);

    updateHomeStat('statsHomeWifiUsers', 38);
    updateHomeStat('statsHomeWifiSignal', 42); // Se muestra como negativo en CSS/Label si aplica
    updateHomeStat('statsHomeWifiBandwidth', 320);
    updateHomeStat('statsHomeWifiChannel', 36);
}

function actualizarEstadisticasPerfiles() {
    fetch('/api/perfiles/stats')
        .then(res => res.json())
        .then(r => {
            if (r.ok && r.data) {
                const s = r.data;
                const updateStat = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.setAttribute('data-target', val);
                        animateValue(el);
                    }
                };
                updateStat('statPerfilesActivos', s.activos || 0);
                updateStat('statPerfilesInactivos', s.inactivos || 0);
                updateStat('statPerfilesSeguros', s.seguros || 0);
                updateStat('statPerfilesTotal', s.total || 0);
            }
        });
}

function actualizarEstadisticasGerencias() {
    fetch('/api/gerencias/stats')
        .then(res => res.json())
        .then(r => {
            if (r.ok && r.data) {
                const s = r.data;
                const updateStat = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.setAttribute('data-target', val);
                        animateValue(el);
                    }
                };
                updateStat('statGerenciasActivas', s.activos || 0);
                updateStat('statGerenciasInactivas', s.inactivos || 0);
                updateStat('statGerenciasSeguras', s.seguros || 0);
                updateStat('statGerenciasTotal', s.total || 0);
            }
        });
}

window.showToast = (msg) => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>[SYSTEM_LOG]</span> ${msg}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// --- TERMINAL LOGIC (XTERM.JS) ---
let terminal = null;
let terminalFit = null;
let currentLine = '';

let terminalSocket = null;

function initTerminal() {
    const container = document.getElementById('terminal-container');
    if (!container) return;

    // Create Terminal
    terminal = new Terminal({
        cursorBlink: true,
        theme: {
            background: '#0a0a0a',
            foreground: '#00ff41',
            cursor: '#00ff41',
            selectionBackground: 'rgba(0, 255, 65, 0.3)'
        },
        fontSize: 13,
        fontFamily: "'Fira Code', 'Courier New', monospace",
        convertEol: true
    });

    terminalFit = new FitAddon.FitAddon();
    terminal.loadAddon(terminalFit);
    terminal.open(container);
    terminalFit.fit();

    // Conectar vía Socket.IO (Namespace /terminal)
    terminalSocket = io('/terminal');

    terminalSocket.on('connect', () => {
        terminal.writeln('\x1b[1;36m[ SISTEMA ]\x1b[0m CONEXIÓN ESTABLECIDA CON EL NÚCLEO VTV.');
        terminal.writeln('\x1b[1;36m[ SISTEMA ]\x1b[0m SESIÓN BASH INICIADA.');
    });

    terminalSocket.on('terminal_output', (data) => {
        terminal.write(data.data);
    });

    terminalSocket.on('disconnect', () => {
        terminal.writeln('\r\n\x1b[1;31m[ ERROR ]\x1b[0m CONEXIÓN PERDIDA CON EL NÚCLEO.');
    });

    // Enviar datos en tiempo real (teclas, secuencias de escape)
    terminal.onData(data => {
        if (terminalSocket && terminalSocket.connected) {
            terminalSocket.emit('terminal_input', { input: data });
        }
    });

    // Resize handling
    window.addEventListener('resize', () => {
        if (terminalFit) terminalFit.fit();
    });
}

// Global hook to open terminal
window.openTerminal = (username) => {
    window.showModal('modalTerminal');
    setTimeout(() => {
        if (terminalFit) terminalFit.fit();
        if (terminal) terminal.focus();
    }, 150);
};

window.toggleTerminal = () => {
    const modal = document.getElementById('modalTerminal');
    if (modal && modal.classList.contains('active')) {
        window.closeModal('modalTerminal');
    } else {
        window.openTerminal('ADMIN');
    }
};

// ══════════════════════════════════════════ CRUD PERFILES ══════════════════════════════════════════════════

function cargarTablaPerfiles(datos) {
    if (perfilesTableInstance) {
        perfilesTableInstance.clear().rows.add(datos).draw();
        return;
    }

    perfilesTableInstance = $('#perfilesTable').DataTable({
        data: datos,
        columns: [
            {
                data: null,
                defaultContent: '<input type="checkbox" class="cyber-check">',
                orderable: false,
                searchable: false,
                width: '30px'
            },
            {
                data: 'id',
                render: (data, type) => {
                    if (type === 'sort' || type === 'type') return parseInt(data);
                    return `<span class="font-mono">#${data}</span>`;
                }
            },
            { 
                data: 'nombre', 
                render: (data) => {
                    const profileClass = `profile-${data.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                    const hasSpecificClass = ['profile-root', 'profile-administrador', 'profile-tecnico', 'profile-seguridad'].includes(profileClass);
                    const finalClass = hasSpecificClass ? profileClass : 'profile-default';
                    return `<span class="profile-badge ${finalClass}">${data}</span>`;
                }
            },
            { data: 'sigla', render: (data) => `<span class="font-mono">${data}</span>` },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (data, type, row) => {
                    const isRoot = row.id === 1 || (row.nombre && row.nombre.toUpperCase() === 'PERFILES SEGURO');
                    const opacity = isRoot ? 'opacity: 0.3; cursor: not-allowed;' : '';
                    const titleEdit = isRoot ? 'Protegido' : 'Editar';
                    const titleDelete = isRoot ? 'Protegido' : 'Eliminar';
                    const onclickEdit = isRoot ? '' : `onclick="editPerfil(${row.id})"`;
                    const onclickDelete = isRoot ? '' : `onclick="deletePerfil(${row.id}, '${row.nombre}')"`;

                    return `
                        <div class="row-actions">
                            <button class="btn btn-outline btn-sm btn-outline-blue" title="${titleEdit}" style="${opacity}" ${onclickEdit}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10z"/>
                                </svg>
                            </button>
                            <button class="btn btn-outline btn-sm btn-outline-red" title="${titleDelete}" style="${opacity}" ${onclickDelete}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/>
                                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1z"/>
                                </svg>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        language: CYBER_TABLE_LANG,
        pageLength: 6,
        lengthMenu: [6, 10, 25, 100],
        autoWidth: false,
        responsive: true,
        dom: '<"top"fl>rt<"bottom"ip><"clear">'
    });
}

window.savePerfil = function () {
    const nombre = document.getElementById('pNombre').value.trim();
    const sigla = document.getElementById('pSigla').value.trim();

    if (!nombre || !sigla) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    const btn = document.getElementById('btnSavePerfil');
    window.setBtnProcessing(btn, true);

    fetch('/api/perfiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla })
    })
        .then(res => res.json())
        .then(data => {
            window.setBtnProcessing(btn, false);
            if (data.ok) {
                closeModal('modalCrearPerfil');
                document.getElementById('formCrearPerfil').reset();
                actualizarTablaPerfiles();
                setTimeout(() => showAlert('PERFIL CREADO EXITOSAMENTE.', 'SUCCESS'), 100);
            } else {
                showAlert(data.mensaje || 'Error al crear perfil');
            }
        })
        .catch(err => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión con el servidor.');
        });
};

window.editPerfil = function (id) {
    fetch(`/api/perfiles/${id}`)
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                const p = response.data;
                document.getElementById('editPerfilId').value = p.id;
                document.getElementById('editPNombre').value = p.nombre;
                document.getElementById('editPSigla').value = p.sigla;
                showModal('modalEditarPerfil');
            } else {
                showAlert(response.mensaje);
            }
        });
};

window.updatePerfil = function () {
    const id = document.getElementById('editPerfilId').value;
    const nombre = document.getElementById('editPNombre').value.trim();
    const sigla = document.getElementById('editPSigla').value.trim();

    if (!nombre || !sigla) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    const btn = document.getElementById('btnUpdatePerfil');
    window.setBtnProcessing(btn, true);

    fetch(`/api/perfiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla })
    })
        .then(res => res.json())
        .then(data => {
            window.setBtnProcessing(btn, false);
            if (data.ok) {
                closeModal('modalEditarPerfil');
                actualizarTablaPerfiles();
                setTimeout(() => showAlert('PERFIL ACTUALIZADO EXITOSAMENTE.', 'SUCCESS'), 100);
            } else {
                showAlert(data.mensaje);
            }
        })
        .catch(err => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión con el servidor.');
        });
};

let profileToDelete = null;
window.deletePerfil = function (id, nombre) {
    profileToDelete = id;
    document.getElementById('deletePerfilTarget').textContent = nombre;
    showModal('modalEliminarPerfil');
};

window.confirmDeletePerfil = function () {
    if (!profileToDelete) return;

    const btn = document.getElementById('btnConfirmDeletePerfil');
    window.setBtnProcessing(btn, true);

    fetch(`/api/perfiles/${profileToDelete}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            window.setBtnProcessing(btn, false);
            if (data.ok) {
                closeModal('modalEliminarPerfil');
                actualizarTablaPerfiles();
                setTimeout(() => showAlert('PERFIL ELIMINADO EXITOSAMENTE.', 'SUCCESS'), 100);
            } else {
                showAlert(data.mensaje);
            }
            profileToDelete = null;
        })
        .catch(err => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión con el servidor.');
        });
};

function actualizarTablaPerfiles() {
    fetch('/api/perfiles')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                cargarTablaPerfiles(response.data);
                actualizarEstadisticasPerfiles();
            }
        });
}


// ══════════════════════════════════════════ CRUD GERENCIAS ══════════════════════════════════════════════════

function cargarTablaGerencias(datos) {
    if (gerenciasTableInstance) {
        gerenciasTableInstance.clear().rows.add(datos).draw();
        return;
    }

    gerenciasTableInstance = $('#gerenciasTable').DataTable({
        data: datos,
        columns: [
            {
                data: null,
                defaultContent: '<input type="checkbox" class="cyber-check">',
                orderable: false,
                searchable: false,
                width: '30px'
            },
            {
                data: 'id',
                render: (data, type) => {
                    if (type === 'sort' || type === 'type') return parseInt(data);
                    return `<span class="font-mono">#${data}</span>`;
                }
            },
            { data: 'nombre', render: (data) => `<span class="gerencia-badge">${data}</span>` },
            {
                data: 'sigla', defaultContent: '', render: (data, type, row) => {
                    const val = data || row.SIGLA || row.Sigla || '';
                    return `<span class="font-mono">${val}</span>`;
                }
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (data, type, row) => {
                    const isRoot = row.id === 1;
                    const opacity = isRoot ? 'opacity: 0.3; cursor: not-allowed;' : '';
                    const titleEdit = isRoot ? 'Protegido' : 'Editar';
                    const titleDelete = isRoot ? 'Protegido' : 'Eliminar';
                    const onclickEdit = isRoot ? '' : `onclick="editGerencia(${row.id})"`;
                    const onclickDelete = isRoot ? '' : `onclick="deleteGerencia(${row.id}, '${row.nombre}')"`;

                    return `
                        <div class="row-actions">
                            <button class="btn btn-outline btn-sm btn-outline-blue" title="${titleEdit}" style="${opacity}" ${onclickEdit}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10z"/>
                                </svg>
                            </button>
                            <button class="btn btn-outline btn-sm btn-outline-red" title="${titleDelete}" style="${opacity}" ${onclickDelete}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/>
                                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1z"/>
                                </svg>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        language: CYBER_TABLE_LANG,
        pageLength: 6,
        lengthMenu: [6, 10, 25, 100],
        autoWidth: false,
        responsive: true,
        dom: '<"top"fl>rt<"bottom"ip><"clear">'
    });
}

function actualizarTablaGerencias() {
    fetch('/api/gerencias')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                cargarTablaGerencias(response.data);
                actualizarEstadisticasGerencias();
            }
        });
}

window.saveGerencia = function () {
    const nombre = document.getElementById('gNombre').value.trim();
    const sigla = document.getElementById('gSigla').value.trim();

    if (!nombre || !sigla) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    const btn = document.getElementById('btnSaveGerencia');
    window.setBtnProcessing(btn, true);

    fetch('/api/gerencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla })
    })
        .then(res => res.json())
        .then(data => {
            window.setBtnProcessing(btn, false);
            if (data.ok) {
                closeModal('modalCrearGerencia');
                document.getElementById('formCrearGerencia').reset();
                actualizarTablaGerencias();
                setTimeout(() => showAlert('GERENCIA CREADA EXITOSAMENTE.', 'SUCCESS'), 100);
            } else {
                showAlert(data.mensaje || 'Error al crear gerencia');
            }
        })
        .catch(() => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión.');
        });
};

window.editGerencia = function (id) {
    fetch(`/api/gerencias/${id}`)
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                const g = response.data;
                document.getElementById('editGerenciaId').value = g.id;
                document.getElementById('editGNombre').value = g.nombre;
                document.getElementById('editGSigla').value = g.sigla;
                showModal('modalEditarGerencia');
            } else {
                showAlert(response.mensaje);
            }
        });
};

window.updateGerencia = function () {
    const id = document.getElementById('editGerenciaId').value;
    const nombre = document.getElementById('editGNombre').value.trim();
    const sigla = document.getElementById('editGSigla').value.trim();

    if (!nombre || !sigla) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    const btn = document.getElementById('btnUpdateGerencia');
    window.setBtnProcessing(btn, true);

    fetch(`/api/gerencias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla })
    })
        .then(res => res.json())
        .then(data => {
            window.setBtnProcessing(btn, false);
            if (data.ok) {
                closeModal('modalEditarGerencia');
                actualizarTablaGerencias();
                setTimeout(() => showAlert('GERENCIA ACTUALIZADA EXITOSAMENTE.', 'SUCCESS'), 100);
            } else {
                showAlert(data.mensaje);
            }
        })
        .catch(() => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión.');
        });
};

let gerenciaToDelete = null;
window.deleteGerencia = function (id, nombre) {
    gerenciaToDelete = id;
    document.getElementById('deleteGerenciaTarget').textContent = nombre;
    showModal('modalEliminarGerencia');
};

window.confirmDeleteGerencia = function () {
    if (!gerenciaToDelete) return;

    const btn = document.getElementById('btnConfirmDeleteGerencia');
    window.setBtnProcessing(btn, true);

    fetch(`/api/gerencias/${gerenciaToDelete}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            window.setBtnProcessing(btn, false);
            if (data.ok) {
                closeModal('modalEliminarGerencia');
                actualizarTablaGerencias();
                setTimeout(() => showAlert('GERENCIA ELIMINADA EXITOSAMENTE.', 'SUCCESS'), 100);
            } else {
                showAlert(data.mensaje);
            }
            gerenciaToDelete = null;
        })
        .catch(() => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión.');
        });
};

// --- DIVISIONES ---

window.actualizarTablaDivisiones = function () {
    actualizarEstadisticasDivisiones();
    fetch('/api/divisiones')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                cargarTablaDivisiones(response.data);
            } else {
                console.error('Error cargando divisiones:', response.mensaje);
                cargarTablaDivisiones([]);
            }
        })
        .catch(err => {
            console.error('Error de conexión:', err);
            cargarTablaDivisiones([]);
        });
}

function cargarTablaDivisiones(datos) {
    if ($.fn.DataTable.isDataTable('#divisionesTable')) {
        $('#divisionesTable').DataTable().destroy();
    }

    $('#divisionesTable').DataTable({
        data: datos,
        order: [[1, 'asc']],
        columns: [
            {
                data: null,
                defaultContent: '<input type="checkbox" class="cyber-check">',
                orderable: false,
                searchable: false,
                width: '30px'
            },
            {
                data: 'id',
                render: (data, type) => {
                    if (type === 'sort' || type === 'type') return parseInt(data);
                    return `<span class="font-mono">#${data}</span>`;
                }
            },
            { data: 'nombre', render: (data) => `<span class="division-badge">${data}</span>` },
            { data: 'sigla', render: (data) => `<span class="font-mono">${data || '---'}</span>` },
            {
                data: 'gerencia_nombre',
                render: (data) => `<span class="badge" style="background: rgba(0, 209, 255, 0.1); color: #00d1ff; border: 1px solid rgba(0, 209, 255, 0.3); font-size: 0.7rem; padding: 2px 8px;">${data || 'SIN ASIGNAR'}</span>`
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (data, type, row) => `
                    <div class="row-actions">
                        <button class="btn btn-outline btn-sm btn-outline-cyan" title="Editar" onclick="editDivision(${row.id})">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5z"/></svg>
                        </button>
                        <button class="btn btn-outline btn-sm btn-outline-red" title="Eliminar" onclick="deleteDivision(${row.id}, '${row.nombre}')">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118z"/></svg>
                        </button>
                    </div>
                `
            }
        ],
        language: CYBER_TABLE_LANG,
        pageLength: 6,
        lengthMenu: [6, 10, 25, 100],
        autoWidth: false,
        responsive: true,
        dom: '<"top"fl>rt<"bottom"ip><"clear">'
    });
}

window.saveDivision = function () {
    const nombre = document.getElementById('dNombre').value.trim();
    const sigla = document.getElementById('dSigla').value.trim();
    const id_gerencia = document.getElementById('dGerencia').value;

    if (!nombre || !sigla || !id_gerencia) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    const btn = document.getElementById('btnSaveDivision');
    window.setBtnProcessing(btn, true);

    fetch('/api/divisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla, id_gerencia })
    })
        .then(res => res.json())
        .then(data => {
            window.setBtnProcessing(btn, false);
            if (data.ok) {
                closeModal('modalCrearDivision');
                document.getElementById('formCrearDivision').reset();
                actualizarTablaDivisiones();
                setTimeout(() => showAlert('DIVISIÓN CREADA EXITOSAMENTE.', 'SUCCESS'), 100);
            } else {
                showAlert(data.mensaje || 'Error al crear división');
            }
        })
        .catch(() => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión.');
        });
};

window.editDivision = function (id) {
    fetch(`/api/divisiones/${id}`)
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                const d = response.data;
                document.getElementById('editDivisionId').value = d.id;
                document.getElementById('editDNombre').value = d.nombre;
                document.getElementById('editDSigla').value = d.sigla;
                document.getElementById('editDGerencia').value = d.id_gerencia;
                showModal('modalEditarDivision');
            } else {
                showAlert(response.mensaje);
            }
        });
};

window.updateDivision = function () {
    const id = document.getElementById('editDivisionId').value;
    const nombre = document.getElementById('editDNombre').value.trim();
    const sigla = document.getElementById('editDSigla').value.trim();
    const id_gerencia = document.getElementById('editDGerencia').value;

    if (!nombre || !sigla || !id_gerencia) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    const btn = document.getElementById('btnUpdateDivision');
    window.setBtnProcessing(btn, true);

    fetch(`/api/divisiones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla, id_gerencia })
    })
        .then(res => res.json())
        .then(data => {
            window.setBtnProcessing(btn, false);
            if (data.ok) {
                closeModal('modalEditarDivision');
                actualizarTablaDivisiones();
                setTimeout(() => showAlert('DIVISIÓN ACTUALIZADA EXITOSAMENTE.', 'SUCCESS'), 100);
            } else {
                showAlert(data.mensaje);
            }
        })
        .catch(() => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión.');
        });
};

let divisionToDelete = null;
window.deleteDivision = function (id, nombre) {
    divisionToDelete = id;
    document.getElementById('deleteDivisionTarget').textContent = nombre;
    showModal('modalEliminarDivision');
};

window.confirmDeleteDivision = function () {
    if (!divisionToDelete) return;

    const btn = document.getElementById('btnConfirmDeleteDivision');
    window.setBtnProcessing(btn, true);

    fetch(`/api/divisiones/${divisionToDelete}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            window.setBtnProcessing(btn, false);
            if (data.ok) {
                closeModal('modalEliminarDivision');
                actualizarTablaDivisiones();
                setTimeout(() => showAlert('DIVISIÓN ELIMINADA EXITOSAMENTE.', 'SUCCESS'), 100);
            } else {
                showAlert(data.mensaje);
            }
            divisionToDelete = null;
        })
        .catch(() => {
            window.setBtnProcessing(btn, false);
            showAlert('Error de conexión.');
        });
};

window.actualizarEstadisticasDivisiones = function () {
    fetch('/api/divisiones/stats')
        .then(res => res.json())
        .then(response => {
            if (response.ok && response.data) {
                const s = response.data;
                const totalDiv = document.getElementById('statsTotalDivisiones');
                const totalGer = document.getElementById('statsTotalGerenciasDiv');
                const totalEqu = document.getElementById('statsEquiposRegistrados');
                const inactEqu = document.getElementById('statsEquiposInactivosDiv');

                if (totalDiv) {
                    totalDiv.setAttribute('data-target', s.total_divisiones || 0);
                    animateValue(totalDiv);
                }
                if (totalGer) {
                    totalGer.setAttribute('data-target', s.total_gerencias || 0);
                    animateValue(totalGer);
                }
                if (totalEqu) {
                    totalEqu.setAttribute('data-target', s.equipos_totales || 0);
                    animateValue(totalEqu);
                }
                if (inactEqu) {
                    inactEqu.setAttribute('data-target', s.equipos_inactivos || 0);
                    animateValue(inactEqu);
                }
            }
        })
        .catch(err => console.error('[SYSTEM] Error actualizando estadísticas de divisiones:', err));
};

// --- MARCAS ---

window.actualizarEstadisticasMarcas = function () {
    fetch('/api/marcas/stats')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                const totalEl = document.getElementById('statsTotalMarcas');
                const activosEl = document.getElementById('statsEquiposActivos');

                if (totalEl) {
                    totalEl.setAttribute('data-target', response.data.total);
                    animateValue(totalEl);
                }
                if (activosEl) {
                    activosEl.setAttribute('data-target', response.data.activos);
                    animateValue(activosEl);
                }
            }
        })
        .catch(err => console.error('Error actualizando stats:', err));
};

window.actualizarTablaMarcas = function () {
    actualizarEstadisticasMarcas();
    fetch('/api/marcas')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                cargarTablaMarcas(response.data);
            } else {
                console.error('Error cargando marcas:', response.mensaje);
                cargarTablaMarcas([]);
            }
        })
        .catch(err => {
            console.error('Error de conexión:', err);
            cargarTablaMarcas([]);
        });
};

function cargarTablaMarcas(datos) {
    if ($.fn.DataTable.isDataTable('#marcasTable')) {
        $('#marcasTable').DataTable().destroy();
    }

    $('#marcasTable').DataTable({
        data: datos,
        order: [[1, 'desc']],
        columns: [
            {
                data: null,
                defaultContent: '<input type="checkbox" class="cyber-check">',
                orderable: false,
                searchable: false,
                width: '30px'
            },
            {
                data: 'id',
                render: (data, type) => {
                    if (type === 'sort' || type === 'type') return parseInt(data);
                    return `<span class="font-mono">#${data}</span>`;
                }
            },
            { data: 'nombre', render: (data) => `<span class="marca-badge">${data}</span>` },
            { data: 'sigla', render: (data) => `<span class="font-mono">${data}</span>` },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (data, type, row) => `
                    <div class="row-actions">
                        <button class="btn btn-outline btn-sm btn-outline-blue" title="Editar" onclick="editMarca(${row.id})">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5z"/></svg>
                        </button>
                        <button class="btn btn-outline btn-sm btn-outline-red" title="Eliminar" onclick="deleteMarca(${row.id}, '${row.nombre}')">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118z"/></svg>
                        </button>
                    </div>
                `
            }
        ],
        language: CYBER_TABLE_LANG,
        pageLength: 6,
        lengthMenu: [6, 10, 25, 100],
        autoWidth: false,
        responsive: true,
        dom: '<"top"fl>rt<"bottom"ip><"clear">'
    });
}

window.guardarMarca = function () {
    const nombre = document.getElementById('mNombre').value.trim();
    const sigla = document.getElementById('mSigla').value.trim();
    const btn = document.querySelector('#modalCrearMarca .btn-primary');

    if (!nombre || !sigla) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    window.setBtnProcessing(btn, true);
    fetch('/api/marcas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla })
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                closeModal('modalCrearMarca');
                document.getElementById('formCrearMarca').reset();
                actualizarTablaMarcas();
                showAlert('MARCA REGISTRADA EXITOSAMENTE.', 'SUCCESS');
            } else {
                showAlert(data.mensaje || 'Error al registrar marca');
            }
        })
        .catch(err => {
            console.error('[SYSTEM] Error saving Marca:', err);
            showAlert('ERROR DE CONEXIÓN.');
        })
        .finally(() => {
            window.setBtnProcessing(btn, false);
        });
};

window.editMarca = function (id) {
    fetch(`/api/marcas/${id}`)
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                const m = response.data;
                document.getElementById('meId').value = m.id;
                document.getElementById('meNombre').value = m.nombre;
                document.getElementById('meSigla').value = m.sigla;
                showModal('modalEditarMarca');
            } else {
                showAlert(response.mensaje);
            }
        });
};

window.actualizarMarca = function () {
    const id = document.getElementById('meId').value;
    const nombre = document.getElementById('meNombre').value.trim();
    const sigla = document.getElementById('meSigla').value.trim();
    const btn = document.querySelector('#modalEditarMarca .btn-primary');

    if (!nombre || !sigla) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    window.setBtnProcessing(btn, true);
    fetch(`/api/marcas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla })
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                closeModal('modalEditarMarca');
                actualizarTablaMarcas();
                showAlert('MARCA ACTUALIZADA EXITOSAMENTE.', 'SUCCESS');
            } else {
                showAlert(data.mensaje);
            }
        })
        .catch(err => {
            console.error('[SYSTEM] Error updating Marca:', err);
            showAlert('ERROR DE CONEXIÓN.');
        })
        .finally(() => {
            window.setBtnProcessing(btn, false);
        });
};

let marcaToDelete = null;
window.deleteMarca = function (id, nombre) {
    marcaToDelete = id;
    document.getElementById('delMarcaNombre').textContent = nombre;
    document.getElementById('delMarcaId').value = id;
    showModal('modalEliminarMarca');
};

window.confirmarEliminarMarca = function () {
    if (!marcaToDelete || !btnEliminarMarca) return;
    window.setBtnProcessing(btnEliminarMarca, true);

    fetch(`/api/marcas/${marcaToDelete}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                closeModal('modalEliminarMarca');
                actualizarTablaMarcas();
                showAlert('MARCA ELIMINADA CORRECTAMENTE.', 'SUCCESS');
            } else {
                showAlert(data.mensaje || 'Error al eliminar la marca.');
            }
            marcaToDelete = null;
        })
        .catch(err => {
            console.error('[SYSTEM] Error deleting Marca:', err);
            showAlert('ERROR DE CONEXIÓN CON EL SERVIDOR.');
        })
        .finally(() => {
            window.setBtnProcessing(btnEliminarMarca, false, 'ELIMINAR MARCA');
        });
};

// --- UBICACIONES ---

window.actualizarTablaUbicaciones = function () {
    actualizarEstadisticasUbicaciones();
    fetch('/api/ubicaciones')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                cargarTablaUbicaciones(response.data);
            } else {
                console.error('Error cargando ubicaciones:', response.mensaje);
                cargarTablaUbicaciones([]);
            }
        })
        .catch(err => {
            console.error('Error de conexión:', err);
            cargarTablaUbicaciones([]);
        });
};

function cargarTablaUbicaciones(datos) {
    if ($.fn.DataTable.isDataTable('#ubicacionTable')) {
        $('#ubicacionTable').DataTable().destroy();
    }

    $('#ubicacionTable').DataTable({
        data: datos,
        order: [[1, 'desc']],
        columns: [
            {
                data: null,
                defaultContent: '<input type="checkbox" class="cyber-check">',
                orderable: false,
                searchable: false,
                width: '30px'
            },
            {
                data: 'id',
                render: (data, type) => {
                    if (type === 'sort' || type === 'type') return parseInt(data);
                    return `<span class="font-mono">#${data}</span>`;
                }
            },
            { data: 'nombre', render: (data) => `<span class="ubicacion-badge">${data}</span>` },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (data, type, row) => `
                    <div class="row-actions">
                        <button class="btn btn-outline btn-sm btn-outline-blue" title="Editar" onclick="editUbicacion(${row.id})">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5z"/></svg>
                        </button>
                        <button class="btn btn-outline btn-sm btn-outline-red" title="Eliminar" onclick="deleteUbicacion(${row.id}, '${row.nombre}')">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118z"/></svg>
                        </button>
                    </div>
                `
            }
        ],
        language: CYBER_TABLE_LANG,
        pageLength: 6,
        lengthMenu: [6, 10, 25, 100],
        autoWidth: false,
        responsive: true,
        dom: '<"top"fl>rt<"bottom"ip><"clear">'
    });
}

window.guardarUbicacion = function () {
    const nombre = document.getElementById('uNombre').value.trim();
    const btn = document.querySelector('#modalCrearUbicacion .btn-primary');

    if (!nombre) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    window.setBtnProcessing(btn, true);
    fetch('/api/ubicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                closeModal('modalCrearUbicacion');
                document.getElementById('formCrearUbicacion').reset();
                actualizarTablaUbicaciones();
                showAlert('UBICACIÓN REGISTRADA EXITOSAMENTE.', 'SUCCESS');
            } else {
                showAlert(data.mensaje || 'Error al registrar ubicación');
            }
        })
        .catch(() => showAlert('ERROR DE CONEXIÓN.'))
        .finally(() => {
            window.setBtnProcessing(btn, false);
        });
};

window.editUbicacion = function (id) {
    fetch(`/api/ubicaciones/${id}`)
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                const u = response.data;
                document.getElementById('ueId').value = u.id;
                document.getElementById('ueNombre').value = u.nombre;
                showModal('modalEditarUbicacion');
            } else {
                showAlert(response.mensaje);
            }
        });
};

window.actualizarUbicacion = function () {
    const id = document.getElementById('ueId').value;
    const nombre = document.getElementById('ueNombre').value.trim();
    const btn = document.querySelector('#modalEditarUbicacion .btn-primary');

    if (!nombre) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    window.setBtnProcessing(btn, true);
    fetch(`/api/ubicaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                closeModal('modalEditarUbicacion');
                actualizarTablaUbicaciones();
                showAlert('UBICACIÓN ACTUALIZADA EXITOSAMENTE.', 'SUCCESS');
            } else {
                showAlert(data.mensaje);
            }
        })
        .catch(() => showAlert('ERROR DE CONEXIÓN.'))
        .finally(() => {
            window.setBtnProcessing(btn, false);
        });
};

let ubicacionToDelete = null;
window.deleteUbicacion = function (id, nombre) {
    ubicacionToDelete = id;
    document.getElementById('delUbicacionNombre').textContent = nombre;
    document.getElementById('delUbicacionId').value = id;
    showModal('modalEliminarUbicacion');
};

window.confirmarEliminarUbicacion = function () {
    if (!ubicacionToDelete) return;
    const btn = document.querySelector('#modalEliminarUbicacion .btn-danger:not(.btn-outline)');
    window.setBtnProcessing(btn, true);

    fetch(`/api/ubicaciones/${ubicacionToDelete}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                closeModal('modalEliminarUbicacion');
                actualizarTablaUbicaciones();
                showAlert('UBICACIÓN ELIMINADA EXITOSAMENTE.', 'SUCCESS');
            } else {
                showAlert(data.mensaje);
            }
            ubicacionToDelete = null;
        })
        .catch(() => showAlert('ERROR DE CONEXIÓN.'))
        .finally(() => {
            window.setBtnProcessing(btn, false, 'ELIMINAR UBICACIÓN');
        });
};

// --- WIFI / EQUIPOS ---

let wifiCatalogos = null;

window.actualizarEstadisticasWifi = function () {
    fetch('/api/wifi/stats')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                const totalEl = document.getElementById('statsWifiTotal');
                const activosEl = document.getElementById('statsWifiActivos');
                const inactivosEl = document.getElementById('statsWifiInactivos');

                if (totalEl) { totalEl.setAttribute('data-target', response.data.total); animateValue(totalEl); }
                if (activosEl) { activosEl.setAttribute('data-target', response.data.activos); animateValue(activosEl); }
                if (inactivosEl) { inactivosEl.setAttribute('data-target', response.data.inactivos); animateValue(inactivosEl); }
            }
        });
};

window.cargarCatalogosWifi = function () {
    fetch('/api/wifi/catalogos')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                wifiCatalogos = response.data;
                llenarSelectoresWifi();
            }
        });
};

function llenarSelectoresWifi() {
    if (!wifiCatalogos) return;

    const selects = [
        { id: 'wGerencia', data: wifiCatalogos.gerencias },
        { id: 'weGerencia', data: wifiCatalogos.gerencias },
        { id: 'wUbicacion', data: wifiCatalogos.ubicaciones },
        { id: 'weUbicacion', data: wifiCatalogos.ubicaciones },
        { id: 'wMarca', data: wifiCatalogos.marcas },
        { id: 'weMarca', data: wifiCatalogos.marcas },
        { id: 'wEstado', data: wifiCatalogos.estados },
        { id: 'weEstado', data: wifiCatalogos.estados }
    ];

    selects.forEach(s => {
        const el = document.getElementById(s.id);
        if (el) {
            const currentVal = el.value;
            el.innerHTML = '<option value="">-- SELECCIONE --</option>';
            s.data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = item.nombre;
                el.appendChild(opt);
            });
            if (currentVal) el.value = currentVal;
        }
    });
}

window.filtrarDivisiones = function (gerenciaSelectId, divisionSelectId) {
    const gerenciaId = document.getElementById(gerenciaSelectId).value;
    const divisionSelect = document.getElementById(divisionSelectId);

    divisionSelect.innerHTML = '<option value="">-- SELECCIONE --</option>';

    if (gerenciaId && wifiCatalogos && wifiCatalogos.divisiones) {
        const filtradas = wifiCatalogos.divisiones.filter(d => d.id_gerencia == gerenciaId);
        filtradas.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.nombre;
            divisionSelect.appendChild(opt);
        });
    }
};

function obtenerDatosFormularioWifi(formId) {
    const isEdit = formId === 'formEditarWifi';
    const prefix = isEdit ? 'we' : 'w';

    // Lista de IDs según el prefijo (w para crear, we para editar)
    const fields = ['Ip', 'Serial', 'Ssid', 'ClavePaso', 'Marca', 'ClaveAdmin', 'Gerencia', 'Division', 'Ubicacion', 'Estado'];
    const data = {};

    for (const field of fields) {
        const el = document.getElementById(`${prefix}${field}`);
        if (!el) {
            console.error(`Campo no encontrado: ${prefix}${field}`);
            return null;
        }
        data[field.toLowerCase()] = el.value.trim();
        // Mapeo especial para IDs y campos con guion bajo
        if (field === 'ClaveAdmin') data.clave_admin = el.value.trim();
        if (field === 'ClavePaso') data.clave_paso = el.value.trim();
        if (field === 'Marca') data.id_marcas = el.value;
        if (field === 'Gerencia') data.id_gerencias = el.value;
        if (field === 'Division') data.id_divisiones = el.value;
        if (field === 'Ubicacion') data.id_ubicaciones = el.value;
        if (field === 'Estado') data.id_estados = el.value;
    }

    if (Object.values(data).some(v => v === "")) {
        showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
        return null;
    }
    return data;
}

window.actualizarTablaWifi = function () {
    actualizarEstadisticasWifi();
    fetch('/api/wifi')
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                cargarTablaWifi(response.data);
            } else {
                cargarTablaWifi([]);
            }
        });
};

function cargarTablaWifi(datos) {
    if ($.fn.DataTable.isDataTable('#wifiTable')) {
        $('#wifiTable').DataTable().destroy();
    }

    $('#wifiTable').DataTable({
        data: datos,
        columns: [
            {
                data: null,
                defaultContent: '<input type="checkbox" class="cyber-check">',
                orderable: false,
                width: '30px'
            },
            { data: 'ssid', render: (data) => `<span class="wifi-badge">${data}</span>` },
            { 
                data: 'clave_paso', 
                render: (data) => `
                    <div class="password-wrapper">
                        <span class="password-hide-icon" 
                              onmouseover="showPasswordPopover(event, '${data}')" 
                              onmouseout="hidePasswordPopover()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </span>
                    </div>
                ` 
            },
            { 
                data: 'ip', 
                render: (data) => {
                    if (!data) return '<span class="text-muted">--</span>';
                    return `<a href="http://${data}" target="_blank" class="ip-link-btn" title="ABRIR INTERFAZ WEB [ http://${data} ]">${data}</a>`;
                }
            },
            { data: 'gerencia' },
            { data: 'ubicacion' },
            { data: 'marca' },
            {
                data: 'estado',
                render: (data, type, row) => `<span class="badge badge-${row.estado_siglas.toLowerCase()}">${data}</span>`
            },
            {
                data: null,
                render: (data, type, row) => `
                    <div class="row-actions">
                        ${row.qr_imagen ? `
                        <button class="btn btn-outline btn-sm btn-outline-yellow" title="Ver QR" onclick="abrirModalQR('${row.qr_imagen}', '${row.ssid}', '${row.clave_paso}')">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M0 .5A.5.5 0 01.5 0h3a.5.5 0 010 1H1v2.5a.5.5 0 01-1 0v-3zM12 0a.5.5 0 01.5.5v3a.5.5 0 01-1 0V1h-2.5a.5.5 0 010-1h3zM.5 12a.5.5 0 01.5.5V15h2.5a.5.5 0 010 1h-3a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5zm15 0a.5.5 0 01.5.5v3a.5.5 0 01-.5.5h-3a.5.5 0 010-1H15v-2.5a.5.5 0 01.5-.5zM4 4h1v1H4V4z"/><path d="M7 2H2v5h5V2zM3 3h3v33V3zm2 8H4v1h1v-1z"/><path d="M7 9H2v5h5V9zm-4 1h3v3H3v-3zm9-6h-1v1h1V4z"/><path d="M9 2h5v5H9V2zm1 1h3v3h-3V3zM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8zm2 2H9V9h1v1zm4 2h-1v1h1v-1z"/><path d="M12 9h2V8h-2v1z"/></svg>
                        </button>` : ''}
                        <button class="btn btn-outline btn-sm btn-outline-blue" title="Editar" onclick="editWifi(${row.id})">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5z"/></svg>
                        </button>
                        <button class="btn btn-outline btn-sm btn-outline-red" title="Eliminar" onclick="deleteWifi(${row.id}, '${row.ssid}')">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118z"/></svg>
                        </button>
                    </div>
                `
            }
        ],
        language: CYBER_TABLE_LANG,
        pageLength: 6,
        dom: '<"top"fl>rt<"bottom"ip><"clear">'
    });
}

// --- PASSWORD REVEAL LOGIC ---
window.showPasswordPopover = function(e, password) {
    let popover = document.getElementById('passPopover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'passPopover';
        popover.className = 'password-popover';
        popover.innerHTML = `
            <span class="popover-label">ACCESO_RESTRINGIDO</span>
            <span class="popover-value"></span>
        `;
        document.body.appendChild(popover);
    }
    
    popover.querySelector('.popover-value').textContent = password;
    
    const icon = e.target.closest('.password-hide-icon');
    const rect = icon.getBoundingClientRect();
    
    // Positioning popover above the icon
    popover.style.left = (rect.left + rect.width / 2 - 90) + 'px';
    popover.style.top = (rect.top - 65) + 'px';
    popover.classList.add('visible');
};

window.hidePasswordPopover = function() {
    const popover = document.getElementById('passPopover');
    if (popover) {
        popover.classList.remove('visible');
    }
};

window.abrirModalQR = function (url, ssid, pass) {
    const img = document.getElementById('imgQrWifi');
    const txtSsid = document.getElementById('txtQrSsid');
    const txtPass = document.getElementById('txtQrPass');
    if (img) img.src = url;
    if (txtSsid) txtSsid.textContent = `SSID: ${ssid}`;
    if (txtPass) txtPass.textContent = `CLAVE: ${pass}`;
    showModal('modalQrWifi');
};

window.guardarWifi = function () {
    const data = obtenerDatosFormularioWifi('formCrearWifi');
    if (!data) return;

    const btn = document.getElementById('btnGuardarWifi');
    window.setBtnProcessing(btn, true);

    fetch('/api/wifi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                closeModal('modalCrearWifi');
                actualizarTablaWifi();
                showAlert('REGISTRO EXITOSO.', 'SUCCESS');
            } else {
                showAlert(data.mensaje);
            }
        })
        .catch(err => {
            console.error('[SYSTEM] Error saving WiFi:', err);
            showAlert('ERROR DE CONEXIÓN CON EL SERVIDOR.');
        })
        .finally(() => {
            window.setBtnProcessing(btn, false);
        });
};

window.editWifi = function (id) {
    fetch(`/api/wifi/${id}`)
        .then(res => res.json())
        .then(response => {
            if (response.ok) {
                const w = response.data;
                document.getElementById('weId').value = w.id;
                document.getElementById('weIp').value = w.ip;
                document.getElementById('weSerial').value = w.serial;
                document.getElementById('weSsid').value = w.ssid;
                document.getElementById('weClavePaso').value = w.clave_paso;
                document.getElementById('weMarca').value = w.id_marcas;
                document.getElementById('weClaveAdmin').value = w.clave_admin;
                document.getElementById('weGerencia').value = w.id_gerencias;

                // Cargar divisiones y luego asignar valor
                filtrarDivisiones('weGerencia', 'weDivision');
                setTimeout(() => {
                    document.getElementById('weDivision').value = w.id_divisiones;
                }, 100);

                document.getElementById('weUbicacion').value = w.id_ubicaciones;
                document.getElementById('weEstado').value = w.id_estados;
                showModal('modalEditarWifi');
            }
        });
};

window.actualizarWifi = function () {
    const id = document.getElementById('weId').value;
    const data = obtenerDatosFormularioWifi('formEditarWifi');
    if (!data) return;

    const btn = document.getElementById('btnActualizarWifi');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '[ PROCESANDO... ]';
    }

    fetch(`/api/wifi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                closeModal('modalEditarWifi');
                actualizarTablaWifi();
                showAlert('EQUIPO ACTUALIZADO.', 'SUCCESS');
            } else {
                showAlert(data.mensaje);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showAlert('ERROR DE CONEXIÓN CON EL SERVIDOR.');
        })
        .finally(() => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '[ ACTUALIZAR EQUIPO ]';
            }
        });
};

let wifiToDelete = null;
window.deleteWifi = function (id, ssid) {
    wifiToDelete = id;
    document.getElementById('delWifiNombre').textContent = `SSID: ${ssid}`;
    showModal('modalEliminarWifi');
};

window.confirmarEliminarWifi = function () {
    if (!wifiToDelete) return;
    const btn = document.querySelector('#modalEliminarWifi .btn-danger:not(.btn-outline)');
    window.setBtnProcessing(btn, true);

    fetch(`/api/wifi/${wifiToDelete}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                closeModal('modalEliminarWifi');
                actualizarTablaWifi();
                showAlert('EQUIPO ELIMINADO.', 'SUCCESS');
            } else {
                showAlert(data.mensaje || 'Error al eliminar el equipo.');
            }
            wifiToDelete = null;
        })
        .catch(err => {
            console.error('[SYSTEM] Error deleting WiFi:', err);
            showAlert('ERROR DE CONEXIÓN AL ELIMINAR.');
        })
        .finally(() => {
            window.setBtnProcessing(btn, false, 'ELIMINAR EQUIPO');
        });
};

// ══════════════════════════════════════════ EXPORTACIÓN PDF ══════════════════════════════════════════════════

// Flag global para bloquear generación múltiple de PDF
let _pdfGenerating = false;

// Función auxiliar para redimensionar imágenes usando Canvas (más rápido y ligero para el PDF)
function _resizeImageToDataURL(imgElement, maxW, maxH) {
    const canvas = document.createElement('canvas');
    canvas.width = maxW;
    canvas.height = maxH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(imgElement, 0, 0, maxW, maxH);
    return canvas.toDataURL('image/png');
}

// Guardar el contenido original del botón para restaurarlo después
const _pdfBtnOriginalHTML = `<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 01.5.5v2.5a1 1 0 001 1h12a1 1 0 001-1v-2.5a.5.5 0 011 0v2.5a2 2 0 01-2 2H2a2 2 0 01-2-2v-2.5a.5.5 0 01.5-.5z"/><path d="M7.646 11.854a.5.5 0 00.708 0l3-3a.5.5 0 00-.708-.708L8.5 10.293V1.5a.5.5 0 00-1 0v8.793L5.354 8.146a.5.5 0 10-.708.708l3 3z"/></svg> PDF`;

const _pdfBtnLoadingHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M12 2v4m0 12v4m-7.07-15.07l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg> GENERANDO...`;

function _setBtnLoading(btn) {
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = _pdfBtnLoadingHTML;
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.7';
}

function _setBtnReady(btn) {
    if (!btn) return;
    btn.disabled = false;
    btn.innerHTML = _pdfBtnOriginalHTML;
    btn.style.pointerEvents = '';
    btn.style.opacity = '';
}

window.exportData = function (btnElement) {
    // Bloquear si ya se está generando un PDF
    if (_pdfGenerating) { return; }
    _pdfGenerating = true;

    // Buscar el botón: puede venir como parámetro o buscarlo en la sección activa
    const btn = btnElement || document.querySelector('section.section.active .btn-export-pdf') || document.querySelector('.btn-export-pdf');
    _setBtnLoading(btn);

    const { jsPDF } = window.jspdf;
    if (!jsPDF) { _pdfGenerating = false; _setBtnReady(btn); return showAlert("Librería de PDF no disponible."); }

    const activeSection = document.querySelector('section.section.active') || document.querySelector('section.section:not([style*="display: none"])');
    const table = activeSection ? activeSection.querySelector('table') : document.getElementById('mainTable');
    let moduleTitle = activeSection ? (activeSection.querySelector('.bc-root') || activeSection.querySelector('.bc-current') || { innerText: "REPORTE" }).innerText.trim().replace(/^\/\/\s*/, '') : "REPORTE";

    if (!table) { _pdfGenerating = false; _setBtnReady(btn); return showAlert("No se encontró tabla para exportar."); }

    // Pequeño delay para que el botón se renderice en estado "cargando" antes del trabajo pesado
    setTimeout(() => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const logoUrl = "/static/Principal/img/logo-VTV.png";

        const addFooter = (doc, data) => {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("Venezolana de Televisión - Generado por Sistema VTV", 15, 288);
            doc.text("Página " + data.pageNumber + " de " + pageCount, 195, 288, { align: "right" });
        };

        const generatePDF = (logoImg, rowImagesMap) => {
            const headers = [];
            const rows = [];
            const tableEl = table;
            const headRows = tableEl.querySelectorAll('thead tr');
            const bodyRows = tableEl.querySelectorAll('tbody tr');
            const isDataTable = $.fn.dataTable.isDataTable(tableEl);
            const isUserModule = moduleTitle.includes("USUARIOS");

            if (isDataTable) {
                const dt = $(tableEl).DataTable();
                const allData = dt.rows({ search: 'applied', order: 'current' }).data().toArray();
                allData.forEach(item => {
                    const rowData = [];
                    if (tableEl.id === 'mainTable') {
                        rowData.push(item.foto_perfil || "");
                        rowData.push(item.username);
                        rowData.push(item.firstName);
                        rowData.push(item.lastName);
                        rowData.push(item.email);
                        rowData.push(item.status);
                    } else if (tableEl.id === 'gerenciasTable') {
                        rowData.push(item.id);
                        rowData.push(item.nombre);
                        rowData.push(item.sigla);
                    } else if (tableEl.id === 'divisionesTable') {
                        rowData.push(item.id);
                        rowData.push(item.nombre);
                        rowData.push(item.sigla);
                        rowData.push(item.gerencia_nombre);
                    } else if (tableEl.id === 'perfilesTable') {
                        rowData.push(item.id);
                        rowData.push(item.nombre);
                        rowData.push(item.sigla);
                    } else if (tableEl.id === 'marcasTable') {
                        rowData.push(item.id);
                        rowData.push(item.nombre);
                        rowData.push(item.sigla);
                    } else if (tableEl.id === 'ubicacionTable') {
                        rowData.push(item.id);
                        rowData.push(item.nombre);
                    } else if (tableEl.id === 'auditoriaWifiTable') {
                        rowData.push(item.id);
                        rowData.push(item.ssid);
                        rowData.push(item.accion);
                        rowData.push(item.estado);
                        rowData.push(item.usuario);
                        rowData.push(item.fecha);
                        rowData.push(item.hora);
                        rowData.push(item.ip);
                    } else if (tableEl.id === 'auditoriaTable') {
                        rowData.push(item.id);
                        rowData.push(item.usuario);
                        rowData.push(item.modulo);
                        rowData.push(item.ip);
                        rowData.push(item.fecha);
                        rowData.push(item.hora_entrada);
                        rowData.push(item.hora_salida || "--:--:--");
                        rowData.push(item.navegador);
                    } else if (tableEl.id === 'wifiTable') {
                        rowData.push(item.ssid);
                        rowData.push(item.clave_paso);
                        rowData.push(item.ip);
                        rowData.push(item.gerencia);
                        rowData.push(item.ubicacion);
                        rowData.push(item.marca);
                        rowData.push(item.estado);
                    } else {
                        Object.keys(item).forEach(key => {
                            if (key !== 'DT_RowId' && typeof item[key] !== 'object') {
                                rowData.push(item[key]);
                            }
                        });
                    }
                    if (rowData.length > 0) rows.push(rowData);
                });
            } else {
                bodyRows.forEach(tr => {
                    const rowData = [];
                    const cells = tr.querySelectorAll('td');
                    cells.forEach((td, i) => {
                        if (i !== 0 && i !== cells.length - 1) {
                            if (isUserModule && i === 1) {
                                const img = td.querySelector('img');
                                rowData.push(img ? img.src : "");
                            } else {
                                rowData.push(td.innerText.trim());
                            }
                        }
                    });
                    rows.push(rowData);
                });
            }

            headRows.forEach(tr => {
                const rowData = [];
                tr.querySelectorAll('th').forEach((th, i) => {
                    if (i !== 0 && i !== tr.cells.length - 1) {
                        rowData.push(th.innerText.trim().replace(/\s*⇅\s*/, ''));
                    }
                });
                headers.push(rowData);
            });

            let logoW = 22, logoH = 22;
            if (logoImg) {
                const ratio = logoImg.width / logoImg.height;
                ratio > 1 ? logoH = logoW / ratio : logoW = logoH * ratio;
            }

            const cleanRows = rows.map(r => r.map((cell, i) => (isUserModule && i === 0) ? "" : cell));

            if (isUserModule && headers.length > 0 && headers[0][0] === 'IMAGEN') {
                headers[0][0] = 'FOTO';
            }

            doc.autoTable({
                head: headers,
                body: cleanRows,
                startY: 55,
                margin: { top: 50, bottom: 20, left: 15, right: 15 },
                styles: { fontSize: 8, cellPadding: 2.5, valign: 'middle', font: 'helvetica' },
                headStyles: { fillColor: [0, 20, 50], textColor: 255, fontStyle: 'bold', halign: 'left' },
                alternateRowStyles: { fillColor: [245, 248, 255] },
                columnStyles: isUserModule ? { 0: { cellWidth: 18, halign: 'center' } } : {},
                didDrawCell: (data) => {
                    if (isUserModule && data.section === 'body' && data.column.index === 0) {
                        const imgSrc = rows[data.row.index][0];
                        const imgDataURL = rowImagesMap[imgSrc];
                        if (imgDataURL) {
                            const size = 8;
                            const x = data.cell.x + (data.cell.width - size) / 2;
                            const y = data.cell.y + (data.cell.height - size) / 2;
                            const cx = x + size / 2;
                            const cy = y + size / 2;
                            const r = size / 2;

                            if (imgSrc.includes('default_avatar')) {
                                doc.setFillColor(230, 255, 230);
                            } else {
                                doc.setFillColor(240, 240, 240);
                            }
                            doc.circle(cx, cy, r, 'F');

                            doc.saveGraphicsState();
                            doc.circle(cx, cy, r, null);
                            doc.clip();
                            doc.discardPath();
                            doc.addImage(imgDataURL, 'PNG', x, y, size, size);
                            doc.restoreGraphicsState();

                            doc.setDrawColor(200, 200, 200);
                            doc.setLineWidth(0.2);
                            doc.circle(cx, cy, r, 'D');
                        }
                    }
                },
                didDrawPage: (data) => {
                    if (logoImg) doc.addImage(logoImg, 'PNG', 15, 10, logoW, logoH);

                    doc.setTextColor(0, 31, 63);
                    doc.setFontSize(13);
                    doc.setFont("helvetica", "bold");
                    doc.text("GERENCIA DE TECNOLOGÍA", 40, 18, { align: "left" });

                    doc.setTextColor(100, 100, 100);
                    doc.setFontSize(7.5);
                    doc.setFont("helvetica", "normal");
                    doc.text("Sistema de Gestión WiFi VTV • Reporte de " + moduleTitle, 40, 23, { align: "left" });

                    doc.setDrawColor(0, 31, 63);
                    doc.setLineWidth(0.5);
                    doc.line(15, 32, 195, 32);

                    doc.setFillColor(0, 20, 50);
                    doc.roundedRect(15, 38, 65, 6, 0.5, 0.5, 'F');

                    doc.setFillColor(255, 255, 255);
                    doc.rect(17, 39, 3.5, 3.5, 'F');
                    doc.setFillColor(200, 0, 0);
                    doc.rect(17, 39, 3.5, 1, 'F');
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.1);
                    doc.rect(17, 39, 3.5, 3.5, 'D');

                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(7.5);
                    doc.setFont("helvetica", "bold");
                    const dateStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
                    doc.text(dateStr, 21.5, 42.2);

                    const totalRegistros = cleanRows.length;
                    const regText = "REGISTROS: " + totalRegistros;
                    doc.setFillColor(0, 20, 50);
                    doc.roundedRect(83, 38, 35, 6, 0.5, 0.5, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(7.5);
                    doc.setFont("helvetica", "bold");
                    doc.text(regText, 100.5, 42.2, { align: "center" });

                    addFooter(doc, data);
                }
            });

            // Generar Blob y mostrar en modal
            setTimeout(() => {
                const blob = doc.output('bloburl');
                const iframe = document.getElementById('pdfFrame');

                _pdfGenerating = false;
                _setBtnReady(btn);

                if (iframe) {
                    iframe.src = blob;
                    window.showModal('modalPDF');

                    document.getElementById('btnDownloadPDF').onclick = () => {
                        doc.save(`Reporte_${moduleTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
                    };
                    document.getElementById('btnPrintPDF').onclick = () => {
                        iframe.contentWindow.print();
                    };
                } else {
                    window.open(blob, '_blank');
                }
            }, 100);
        };

        // ── Carga de recursos (logo + imágenes de usuarios) ──
        let logoLoaded = false;
        let logoImg = null;

        const isUserModule = moduleTitle.includes("USUARIOS");
        let tableImgs = [];
        if (isUserModule) {
            if ($.fn.DataTable.isDataTable(table)) {
                const dt = $(table).DataTable();
                tableImgs = dt.rows({ search: 'applied' }).data().toArray().map(u => u.foto_perfil);
            } else {
                tableImgs = Array.from(table.querySelectorAll('tbody tr td:nth-child(2) img')).map(img => img.src);
            }
        }
        const uniqueTableImgs = [...new Set(tableImgs)].filter(x => x);
        const rowImagesMap = {};
        let loadedTableImgsCount = 0;

        const finalize = () => {
            if (logoLoaded && (loadedTableImgsCount >= uniqueTableImgs.length)) {
                generatePDF(logoImg, rowImagesMap);
            }
        };

        // Cargar logo
        const imgLogo = new Image();
        imgLogo.crossOrigin = "Anonymous";
        imgLogo.src = logoUrl;
        imgLogo.onload = () => { logoImg = imgLogo; logoLoaded = true; finalize(); };
        imgLogo.onerror = () => { logoLoaded = true; finalize(); };

        // Cargar y redimensionar imágenes de usuarios
        if (uniqueTableImgs.length > 0) {
            uniqueTableImgs.forEach(url => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = url;
                img.onload = () => {
                    rowImagesMap[url] = _resizeImageToDataURL(img, 64, 64);
                    loadedTableImgsCount++;
                    finalize();
                };
                img.onerror = () => { loadedTableImgsCount++; finalize(); };
            });
        } else {
            finalize();
        }
    }, 50);
};


// ── SISTEMA DE DETECCIÓN DE INACTIVIDAD ──
let inactividadTimer;
let countdownTimer;
const TIEMPO_INACTIVIDAD = 6 * 60 * 1000; // 10 minutos
const TIEMPO_GRACIA = 60; // 60 segundos

function initInactividad() {
    // Escuchar eventos de actividad
    document.onmousemove = resetInactividadTimer;
    document.onkeydown = resetInactividadTimer;
    document.onmousedown = resetInactividadTimer;
    document.ontouchstart = resetInactividadTimer;
    document.onclick = resetInactividadTimer;
    document.onscroll = resetInactividadTimer;

    resetInactividadTimer();
}

function resetInactividadTimer() {
    clearTimeout(inactividadTimer);

    // Si el modal de inactividad está abierto, no reseteamos el timer principal automáticamente
    // para forzar la interacción con el botón "Seguir conectado"
    if (document.getElementById('modalInactividad').classList.contains('active')) return;

    inactividadTimer = setTimeout(mostrarAlertaInactividad, TIEMPO_INACTIVIDAD);
}

function mostrarAlertaInactividad() {
    window.showModal('modalInactividad');
    let timeLeft = TIEMPO_GRACIA;
    const display = document.getElementById('inactividadCountdown');
    display.textContent = timeLeft;

    countdownTimer = setInterval(() => {
        timeLeft--;
        display.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            window.location.href = '/logout';
        }
    }, 1000);
}

window.resetInactividadManual = function () {
    clearInterval(countdownTimer);
    window.closeModal('modalInactividad');
    // Al cerrar manualmente, reiniciamos el ciclo completamente
    inactividadTimer = setTimeout(mostrarAlertaInactividad, TIEMPO_INACTIVIDAD);
};

// ── LÓGICA DE SEGURIDAD: CAMBIO DE CLAVE ──
window.cambiarMiClave = function () {
    const clave = document.getElementById('segNuevaClave').value;
    const confirmar = document.getElementById('segConfirmarClave').value;
    const btn = document.getElementById('btnGuardarSeguridad');

    if (!clave || !confirmar) {
        return showAlert('POR FAVOR, COMPLETE AMBOS CAMPOS DE CONTRASEÑA.');
    }

    if (clave !== confirmar) {
        return showAlert('LAS CONTRASEÑAS NO COINCIDEN. VERIFIQUE E INTENTE NUEVAMENTE.');
    }

    if (clave.length < 4) {
        return showAlert('LA CONTRASEÑA DEBE TENER AL MENOS 4 CARACTERES POR SEGURIDAD.');
    }

    window.setBtnProcessing(btn, true);

    fetch('/api/usuarios/cambiar-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nueva_clave: clave })
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                showAlert('CONTRASEÑA ACTUALIZADA EXITOSAMENTE.', 'SUCCESS');
                document.getElementById('formCambiarClave').reset();
            } else {
                showAlert(data.mensaje || 'ERROR AL ACTUALIZAR LA CONTRASEÑA.');
            }
        })
        .catch(() => showAlert('ERROR DE CONEXIÓN CON EL SERVIDOR.'))
        .finally(() => {
            window.setBtnProcessing(btn, false, '[ ACTUALIZAR CONTRASEÑA ]');
        });
};
