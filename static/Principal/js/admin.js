/**
 * CYBER ADMIN DASHBOARD - MAIN LOGIC
 * Handles menu navigation, sidebar toggling, stats counters, and matrix background.
 */
let mainTableInstance = null;
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

    // BOTON TERMINAL TOPBAR
    const btnTop = document.getElementById('btnTerminalTop');
    if (btnTop) {
        btnTop.addEventListener('click', () => {
            if (window.openTerminal) window.openTerminal('ADMIN');
        });
    }
});

// --- SERVIDORES ---
function initServidores() {
    // Placeholder for future server list polling/management
    console.log("[SYSTEM] Servidores inicializados.");
}

window.quickSSH = (ip) => {
    if (window.openTerminal) {
        window.openTerminal('ADMIN');
        // Small delay to ensure terminal is ready
        setTimeout(() => {
            if (terminal) {
                terminal.writeln(`\r\n\x1b[1;33m[CONNECTING]\x1b[0m Iniciando enlace con ${ip}...`);
                terminal.write(`ssh root@${ip}\r\n`);
                // In a real scenario, we would send this to the backend
                // terminal.onData handleCommand would grab it if we simulate the 'Enter'
                currentLine = `ssh root@${ip}`;
                handleCommand(currentLine);
                currentLine = '';
            }
        }, 500);
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
            break;
        case 'gerencias':
            actualizarTablaGerencias();
            break;
        case 'divisiones':
            actualizarTablaDivisiones();
            break;
        // Agregaremos otros módulos según sea necesario
        default:
            // Por defecto, intentar actualizar estadísticas de sistema si existen
            if (window.actualizarEstadisticas) actualizarEstadisticas();
            break;
    }
}

// --- STATS ANIMATION ---
function initStats() {
    const statValues = document.querySelectorAll('.stat-value[data-target]');

    const animateValue = (el) => {
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
    // Mapear campos de SQL Server al formato que espera DataTables
    const dataFormateada = datos.map(u => ({
        id:          u.id,
        username:    u.usuario,
        firstName:   u.primer_nombre,
        lastName:    u.primer_apellido,
        email:       u.correo || 'Sin correo',
        status:      u.estado  || 'ACTIVO',
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
                                <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/>
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

    const MARCAS_MOCK = [
        { id: 501, name: 'Cisco', level: 'Network', supervisor: 'Admin', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 502, name: 'Ubiquiti', level: 'WiFi', supervisor: 'Admin', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 503, name: 'MikroTik', level: 'Router', supervisor: 'Admin', status: 'ACTIVO', lastAccess: '2024-03-01' },
    ];

    if ($('#marcasTable').length) {
        $('#marcasTable').DataTable({
            data: MARCAS_MOCK,
            columns: [
                {
                    data: null,
                    defaultContent: '<input type="checkbox" class="cyber-check">',
                    orderable: false,
                    searchable: false,
                    width: '30px'
                },
                { data: 'id', render: (data) => `<span class="font-mono">#${data}</span>` },
                { data: 'name', render: (data) => `<span class="font-bold text-green">${data}</span>` },
                { data: 'level' },
                { data: 'supervisor', render: (data) => `<span class="badge badge-${data.toLowerCase()}">${data}</span>` },
                { data: 'status', render: (data) => `<span class="status-badge status-${data.toLowerCase()}">${data}</span>` },
                { data: 'lastAccess', render: (data) => `<span class="font-mono text-small">${data}</span>` },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: (data, type, row) => `
                        <div class="row-actions">
                            <button class="btn btn-outline btn-sm" title="Editar"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5z"/></svg></button>
                            <button class="btn btn-outline btn-sm btn-outline-red" title="Eliminar"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118z"/></svg></button>
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

    const UBICACION_MOCK = [
        { id: 601, name: 'Sede Principal', level: 'Edificio', supervisor: 'Admin', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 602, name: 'Planta Transmisora', level: 'Antena', supervisor: 'Admin', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 603, name: 'Estudio 1', level: 'Estudio', supervisor: 'Admin', status: 'ACTIVO', lastAccess: '2024-03-01' },
    ];

    if ($('#ubicacionTable').length) {
        $('#ubicacionTable').DataTable({
            data: UBICACION_MOCK,
            columns: [
                {
                    data: null,
                    defaultContent: '<input type="checkbox" class="cyber-check">',
                    orderable: false,
                    searchable: false,
                    width: '30px'
                },
                { data: 'id', render: (data) => `<span class="font-mono">#${data}</span>` },
                { data: 'name', render: (data) => `<span class="font-bold text-green">${data}</span>` },
                { data: 'level' },
                { data: 'supervisor', render: (data) => `<span class="badge badge-${data.toLowerCase()}">${data}</span>` },
                { data: 'status', render: (data) => `<span class="status-badge status-${data.toLowerCase()}">${data}</span>` },
                { data: 'lastAccess', render: (data) => `<span class="font-mono text-small">${data}</span>` },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: (data, type, row) => `
                        <div class="row-actions">
                            <button class="btn btn-outline btn-sm" title="Editar"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5z"/></svg></button>
                            <button class="btn btn-outline btn-sm btn-outline-red" title="Eliminar"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118z"/></svg></button>
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

    const WIFI_MOCK = [
        { id: 701, name: 'VTV-Corp', level: '5GHz', supervisor: 'WPA3', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 702, name: 'VTV-Invitados', level: '2.4GHz', supervisor: 'Open', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 703, name: 'VTV-Produccion', level: '5GHz', supervisor: 'WPA2-ENT', status: 'ACTIVO', lastAccess: '2024-03-01' },
    ];

    if ($('#wifiTable').length) {
        $('#wifiTable').DataTable({
            data: WIFI_MOCK,
            columns: [
                {
                    data: null,
                    defaultContent: '<input type="checkbox" class="cyber-check">',
                    orderable: false,
                    searchable: false,
                    width: '30px'
                },
                { data: 'id', render: (data) => `<span class="font-mono">#${data}</span>` },
                { data: 'name', render: (data) => `<span class="font-bold text-green">${data}</span>` },
                { data: 'level' },
                { data: 'supervisor', render: (data) => `<span class="badge badge-${data.toLowerCase()}">${data}</span>` },
                { data: 'status', render: (data) => `<span class="status-indicator status-${data.toLowerCase()}">${data}</span>` },
                { data: 'lastAccess', render: (data) => `<span class="font-mono text-small">${data}</span>` },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: (data, type, row) => `
                        <div class="row-actions">
                            <button class="btn btn-outline btn-sm" title="Editar"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5z"/></svg></button>
                            <button class="btn btn-outline btn-sm btn-outline-red" title="Eliminar"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118z"/></svg></button>
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

    const AUDITORIA_MOCK = [
        { id: 1, user: 'neo_anderson', action: 'LOGIN', details: 'Acceso exitoso al sistema', ip: '192.168.1.105', datetime: '2026-03-24 12:10:05', status: 'SUCCESS' },
        { id: 2, user: 'smith_agent', action: 'LOGIN_FAIL', details: 'Contraseña incorrecta', ip: '10.0.0.8', datetime: '2026-03-24 11:45:22', status: 'FAILURE' },
        { id: 3, user: 'trinity_v', action: 'UPDATE_WIFI', details: 'Cambio de SSID en AP_Sede', ip: '192.168.1.20', datetime: '2026-03-24 10:30:15', status: 'SUCCESS' },
        { id: 4, user: 'morpheus_sub', action: 'DELETE_USER', details: 'Eliminado usuario temporal: guest_vtv', ip: '192.168.1.50', datetime: '2026-03-24 09:20:44', status: 'SUCCESS' }
    ];

    if ($('#auditoriaTable').length) {
        $('#auditoriaTable').DataTable({
            data: AUDITORIA_MOCK,
            columns: [
                {
                    data: null,
                    defaultContent: '<input type="checkbox" class="cyber-check">',
                    orderable: false,
                    searchable: false,
                    width: '30px'
                },
                { data: 'id', render: (data) => `<span class="font-mono">#${data}</span>` },
                { data: 'user', render: (data) => `<span class="font-bold text-green">${data}</span>` },
                { data: 'action', render: (data) => `<span class="badge badge-${data.toLowerCase().includes('fail') ? 'danger' : 'info'}">${data}</span>` },
                { data: 'details' },
                { data: 'ip', render: (data) => `<span class="font-mono text-small">${data}</span>` },
                { data: 'datetime', render: (data) => `<span class="font-mono text-small">${data}</span>` },
                { data: 'status', render: (data) => `<span class="status-indicator status-${data.toLowerCase()}">${data}</span>` }
            ],
            language: CYBER_TABLE_LANG,
            pageLength: 6,
            lengthMenu: [6, 10, 25, 100],
            autoWidth: false,
            responsive: true,
            dom: '<"top"fl>rt<"bottom"ip><"clear">'
        });
    }

    const AUDITORIA_WIFI_MOCK = [
        { id: 1, ap: 'AP_PB_RECEPCION', action: 'RESTART', details: 'Reinicio remoto por latencia alta', user: 'admin_tech', datetime: '2026-03-24 11:30:00', status: 'SUCCESS' },
        { id: 2, ap: 'AP_P1_ESTUDIO1', action: 'WIFI_PWD_CHANGE', details: 'Actualización de clave WPA3', user: 'trinity_v', datetime: '2026-03-24 10:15:45', status: 'SUCCESS' },
        { id: 3, ap: 'AP_P2_GERENCIA', action: 'CHANNEL_UPDATE', details: 'Cambio automático canal 6 -> 11', user: 'SYSTEM', datetime: '2026-03-24 09:00:12', status: 'NOTICE' },
        { id: 4, ap: 'AP_EXTERIOR_PATIO', action: 'OFFLINE', details: 'Pérdida de enlace con controlador', user: 'SYSTEM', datetime: '2026-03-24 08:45:33', status: 'FAILURE' }
    ];

    if ($('#auditoriaWifiTable').length) {
        $('#auditoriaWifiTable').DataTable({
            data: AUDITORIA_WIFI_MOCK,
            columns: [
                {
                    data: null,
                    defaultContent: '<input type="checkbox" class="cyber-check">',
                    orderable: false,
                    searchable: false,
                    width: '30px'
                },
                { data: 'id', render: (data) => `<span class="font-mono">#${data}</span>` },
                { data: 'ap', render: (data) => `<span class="font-bold text-green">${data}</span>` },
                { data: 'action', render: (data) => `<span class="badge badge-info">${data}</span>` },
                { data: 'details' },
                { data: 'user', render: (data) => `<span class="font-bold">${data}</span>` },
                { data: 'datetime', render: (data) => `<span class="font-mono text-small">${data}</span>` },
                { data: 'status', render: (data) => `<span class="status-badge status-${data.toLowerCase()}">${data}</span>` }
            ],
            language: CYBER_TABLE_LANG,
            pageLength: 6,
            lengthMenu: [6, 10, 25, 100],
            autoWidth: false,
            responsive: true,
            dom: '<"top"fl>rt<"bottom"ip><"clear">'
        });
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
        gov.classList.remove('fire');
        void gov.offsetWidth;
        gov.classList.add('fire');
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
});

// --- MODAL HELPERS ---
window.showModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
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
        reader.onload = function(e) {
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
        setTimeout(() => modal.style.display = 'none', 400);
        document.body.style.overflow = '';
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
            
            setValue('vFirstName',  u.primer_nombre);
            setValue('vLastName',   u.primer_apellido);
            setValue('vUsername',   u.usuario);
            setValue('vCedula',     u.cedula);
            setValue('vPhone',      u.telefono);
            setValue('vProfile',    u.id_perfil);
            setValue('vStatus',     u.id_estado);
            setValue('vGerencia',   u.id_gerencia);
            
            const divUrl = u.id_gerencia ? `/api/divisiones?id_gerencia=${u.id_gerencia}` : '/api/divisiones';
            cargarSelectDesdeApi(divUrl, ['vDivision'], 'id', 'nombre').then(() => {
                setValue('vDivision', u.id_division);
            });

            setValue('vEmail',      u.correo);
            setValue('vPassword',   u.clave);
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

            setValue('eEditId',     u.id);
            setValue('eFirstName',      u.primer_nombre);
            setValue('eSecondName',     u.segundo_nombre);
            setValue('eLastName',       u.primer_apellido);
            setValue('eSecondLastName', u.segundo_apellido);
            setValue('eUsername',       u.usuario);
            setValue('eCedula',         u.cedula);
            setValue('ePhone',          u.telefono);
            setValue('eProfile',        u.id_perfil);
            setValue('eStatus',         u.id_estado);
            setValue('eGerencia',       u.id_gerencia);
            
            const divUrl = u.id_gerencia ? `/api/divisiones?id_gerencia=${u.id_gerencia}` : '/api/divisiones';
            cargarSelectDesdeApi(divUrl, ['eDivision'], 'id', 'nombre').then(() => {
                setValue('eDivision', u.id_division);
            });
            
            setValue('eEmail',      u.correo);
            setValue('ePassword',   u.clave); // Mostrar clave actual en edición
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
        primer_nombre:    fFirstName,
        segundo_nombre:   fSecondName,
        primer_apellido:  fLastName,
        segundo_apellido: fSecondLastName,
        usuario:          getVal('fUsername'),
        clave:            getVal('fPassword'),
        cedula:           fCedula,
        telefono:         fPhone,
        correo:           fEmail,
        id_perfil:        fProfile,
        id_estado:        1, // Por defecto activo al crear
        id_gerencia:      fGerencia,
        id_division:      fDivision,
    };

    if (window.currentProfileImageBase64) {
        datos.foto_perfil = window.currentProfileImageBase64;
    }

    fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(res => res.json())
    .then(r => {
        if (r.ok) {
            showAlert('✅ Registro guardado correctamente.');
            closeModal('modalCrearUsuarios');
            recargarTabla();
            actualizarEstadisticas();
        } else {
            showAlert(r.mensaje);
        }
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
        primer_nombre:    eFirstName,
        segundo_nombre:   eSecondName,
        primer_apellido:  eLastName,
        segundo_apellido: eSecondLastName,
        usuario:          eUsername,
        cedula:           eCedula,
        telefono:         ePhone,
        correo:           eEmail,
        id_perfil:        eProfile,
        id_estado:        eStatus,
        id_gerencia:      eGerencia,
        id_division:      eDivision,
    };
    
    if (window.currentProfileImageBase64) {
        datos.foto_perfil = window.currentProfileImageBase64;
    }
    
    if (ePassword && ePassword !== '') {
        datos.clave = ePassword;
    }

    fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(res => res.json())
    .then(r => {
        if (r.ok) {
            showAlert('✅ Registro actualizado correctamente.');
            closeModal('modalEditarUsuarios');
            recargarTabla();
            actualizarEstadisticas();
        } else {
            showAlert(r.mensaje);
        }
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
    fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(r => {
        if (r.ok) {
            showAlert('✅ Registro eliminado correctamente.');
            closeModal('modalEliminarUsuarios');
            recargarTabla();
            actualizarEstadisticas();
        } else {
            showAlert(r.mensaje);
        }
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
function initCatalogos() {
    cargarSelectDesdeApi('/api/perfiles',  ['fProfile', 'eProfile', 'vProfile'],  'id', 'nombre');
    cargarSelectDesdeApi('/api/gerencias', ['fGerencia', 'eGerencia', 'vGerencia', 'dGerencia', 'editDGerencia'], 'id', 'nombre');
    cargarSelectDesdeApi('/api/divisiones', ['fDivision', 'eDivision', 'vDivision'], 'id', 'nombre');
    
    cargarSelectDesdeApi('/api/estados',    ['fStatus', 'eStatus', 'vStatus'],    'id', 'nombre')
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
    if (mainTableInstance) {
        mainTableInstance.destroy();
        mainTableInstance = null;
    }
    initTable();
}

function actualizarEstadisticas() {
    fetch('/api/usuarios/stats')
    .then(res => res.json())
    .then(r => {
        if (r.ok && r.data) {
            const s = r.data;
            const animateValue = (id, val) => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = val;
                }
            };
            animateValue('statActivos',    s.activos    || 0);
            animateValue('statInactivos',  s.inactivos  || 0);
            animateValue('statBloqueados', s.bloqueados || 0);
            animateValue('statTotal',      s.total      || 0);
        }
    });
}

function actualizarEstadisticasPerfiles() {
    fetch('/api/perfiles/stats')
    .then(res => res.json())
    .then(r => {
        if (r.ok && r.data) {
            const s = r.data;
            const animateValue = (id, val) => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = val;
                }
            };
            animateValue('statPerfilesActivos',   s.activos    || 0);
            animateValue('statPerfilesInactivos', s.inactivos  || 0);
            animateValue('statPerfilesSeguros',   s.seguros    || 0);
            animateValue('statPerfilesTotal',     s.total      || 0);
        }
    });
}

function actualizarEstadisticasGerencias() {
    fetch('/api/gerencias/stats')
    .then(res => res.json())
    .then(r => {
        if (r.ok && r.data) {
            const s = r.data;
            const animateValue = (id, val) => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = val;
                }
            };
            animateValue('statGerenciasActivas',   s.activos   || 0);
            animateValue('statGerenciasInactivas', s.inactivos || 0);
            animateValue('statGerenciasSeguras',   s.seguros   || 0);
            animateValue('statGerenciasTotal',     s.total     || 0);
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

    // Conectar vía Socket.IO
    terminalSocket = io();

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

// ══════════════════════════════════════════ CRUD PERFILES ══════════════════════════════════════════════════

function cargarTablaPerfiles(datos) {
    if ($.fn.DataTable.isDataTable('#perfilesTable')) {
        $('#perfilesTable').DataTable().destroy();
    }

    $('#perfilesTable').DataTable({
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
            { data: 'nombre', render: (data) => `<span class="font-bold text-green">${data}</span>` },
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

window.savePerfil = function() {
    const nombre = document.getElementById('pNombre').value.trim();
    const sigla = document.getElementById('pSigla').value.trim();

    if (!nombre || !sigla) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    fetch('/api/perfiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            closeModal('modalCrearPerfil');
            document.getElementById('formCrearPerfil').reset();
            actualizarTablaPerfiles();
            showAlert('PERFIL CREADO EXITOSAMENTE.', 'SUCCESS');
        } else {
            showAlert(data.mensaje || 'Error al crear perfil');
        }
    });
};

window.editPerfil = function(id) {
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

window.updatePerfil = function() {
    const id = document.getElementById('editPerfilId').value;
    const nombre = document.getElementById('editPNombre').value.trim();
    const sigla = document.getElementById('editPSigla').value.trim();

    if (!nombre || !sigla) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    fetch(`/api/perfiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            closeModal('modalEditarPerfil');
            actualizarTablaPerfiles();
            showAlert('PERFIL ACTUALIZADO EXITOSAMENTE.', 'SUCCESS');
        } else {
            showAlert(data.mensaje);
        }
    });
};

let profileToDelete = null;
window.deletePerfil = function(id, nombre) {
    profileToDelete = id;
    document.getElementById('deletePerfilTarget').textContent = nombre;
    showModal('modalEliminarPerfil');
};

window.confirmDeletePerfil = function() {
    if (!profileToDelete) return;
    
    fetch(`/api/perfiles/${profileToDelete}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            closeModal('modalEliminarPerfil');
            actualizarTablaPerfiles();
            showAlert('PERFIL ELIMINADO EXITOSAMENTE.', 'SUCCESS');
        } else {
            showAlert(data.mensaje);
        }
        profileToDelete = null;
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
    if ($.fn.DataTable.isDataTable('#gerenciasTable')) {
        $('#gerenciasTable').DataTable().destroy();
    }

    $('#gerenciasTable').DataTable({
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
            { data: 'nombre', render: (data) => `<span class="font-bold text-green">${data}</span>` },
            { data: 'sigla', defaultContent: '', render: (data, type, row) => {
                const val = data || row.SIGLA || row.Sigla || '';
                return `<span class="font-mono">${val}</span>`;
            }},
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (data, type, row) => {
                    const isRoot = row.id === 1;
                    const opacity = isRoot ? 'opacity: 0.3; cursor: not-allowed;' : '';
                    const titleEdit = isRoot ? 'Protegido' : 'Editar';
                    const titleDelete = isRoot ? 'Protegido' : 'Eliminar';
                    // Nota: Necesitas implementar editGerencia y deleteGerencia o adaptarlos
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

window.saveGerencia = function() {
    const nombre = document.getElementById('gNombre').value.trim();
    const sigla = document.getElementById('gSigla').value.trim();

    if (!nombre || !sigla) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    fetch('/api/gerencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            closeModal('modalCrearGerencia');
            document.getElementById('formCrearGerencia').reset();
            actualizarTablaGerencias();
            showAlert('GERENCIA CREADA EXITOSAMENTE.', 'SUCCESS');
        } else {
            showAlert(data.mensaje || 'Error al crear gerencia');
        }
    });
};

window.editGerencia = function(id) {
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

window.updateGerencia = function() {
    const id = document.getElementById('editGerenciaId').value;
    const nombre = document.getElementById('editGNombre').value.trim();
    const sigla = document.getElementById('editGSigla').value.trim();

    if (!nombre || !sigla) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    fetch(`/api/gerencias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            closeModal('modalEditarGerencia');
            actualizarTablaGerencias();
            showAlert('GERENCIA ACTUALIZADA EXITOSAMENTE.', 'SUCCESS');
        } else {
            showAlert(data.mensaje);
        }
    });
};

let gerenciaToDelete = null;
window.deleteGerencia = function(id, nombre) {
    gerenciaToDelete = id;
    document.getElementById('deleteGerenciaTarget').textContent = nombre;
    showModal('modalEliminarGerencia');
};

window.confirmDeleteGerencia = function() {
    if (!gerenciaToDelete) return;
    
    fetch(`/api/gerencias/${gerenciaToDelete}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            closeModal('modalEliminarGerencia');
            actualizarTablaGerencias();
            showAlert('GERENCIA ELIMINADA EXITOSAMENTE.', 'SUCCESS');
        } else {
            showAlert(data.mensaje);
        }
        gerenciaToDelete = null;
    });
};

// --- DIVISIONES ---

window.actualizarTablaDivisiones = function () {
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
            { data: 'nombre', render: (data) => `<span class="font-bold text-green">${data}</span>` },
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

window.saveDivision = function() {
    const nombre = document.getElementById('dNombre').value.trim();
    const sigla = document.getElementById('dSigla').value.trim();
    const id_gerencia = document.getElementById('dGerencia').value;

    if (!nombre || !sigla || !id_gerencia) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    fetch('/api/divisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla, id_gerencia })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            closeModal('modalCrearDivision');
            document.getElementById('formCrearDivision').reset();
            actualizarTablaDivisiones();
            showAlert('DIVISIÓN CREADA EXITOSAMENTE.', 'SUCCESS');
        } else {
            showAlert(data.mensaje || 'Error al crear división');
        }
    });
};

window.editDivision = function(id) {
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

window.updateDivision = function() {
    const id = document.getElementById('editDivisionId').value;
    const nombre = document.getElementById('editDNombre').value.trim();
    const sigla = document.getElementById('editDSigla').value.trim();
    const id_gerencia = document.getElementById('editDGerencia').value;

    if (!nombre || !sigla || !id_gerencia) {
        return showAlert('DEBE COMPLETAR TODOS LOS CAMPOS.');
    }

    fetch(`/api/divisiones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sigla, id_gerencia })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            closeModal('modalEditarDivision');
            actualizarTablaDivisiones();
            showAlert('DIVISIÓN ACTUALIZADA EXITOSAMENTE.', 'SUCCESS');
        } else {
            showAlert(data.mensaje);
        }
    });
};

let divisionToDelete = null;
window.deleteDivision = function(id, nombre) {
    divisionToDelete = id;
    document.getElementById('deleteDivisionTarget').textContent = nombre;
    showModal('modalEliminarDivision');
};

window.confirmDeleteDivision = function() {
    if (!divisionToDelete) return;
    
    fetch(`/api/divisiones/${divisionToDelete}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            closeModal('modalEliminarDivision');
            actualizarTablaDivisiones();
            showAlert('DIVISIÓN ELIMINADA EXITOSAMENTE.', 'SUCCESS');
        } else {
            showAlert(data.mensaje);
        }
        divisionToDelete = null;
    });
};

// ══════════════════════════════════════════ EXPORTACIÓN PDF ══════════════════════════════════════════════════

window.exportData = function () {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { return showAlert("Librería de PDF no disponible."); }

    const doc = new jsPDF('p', 'mm', 'a4');
    const logoUrl = "/static/Principal/img/logo-VTV.png";
    const activeSection = document.querySelector('section.section.active') || document.querySelector('section.section:not([style*="display: none"])');
    const table = activeSection ? activeSection.querySelector('table') : document.getElementById('mainTable');
    
    let moduleTitle = activeSection ? (activeSection.querySelector('.bc-root') || activeSection.querySelector('.bc-current') || {innerText: "REPORTE"}).innerText.trim().replace(/^\/\/\s*/, '') : "REPORTE";

    if (!table) { return showAlert("No se encontró tabla para exportar."); }

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
                // Mapeo según la estructura de datos de cada tabla definida en admin.js
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
                } else {
                    // Fallback para tablas genéricas que podrían no estar mapeadas
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

        // Extraer cabecera (se mantiene del DOM ya que es fija)
        headRows.forEach(tr => {
            const rowData = [];
            tr.querySelectorAll('th').forEach((th, i) => {
                if (i !== 0 && i !== tr.cells.length - 1) {
                    rowData.push(th.innerText.trim().replace(/\s*⇅\s*/, ''));
                }
            });
            headers.push(rowData);
        });

        // Calcular dimensiones del logo y generar ID único una sola vez
        const reportId = "VTV-" + new Date().toISOString().slice(0, 10).replace(/-/g, '') + "-" + Math.random().toString(36).substr(2, 6).toUpperCase();
        let logoW = 22, logoH = 22;
        if (logoImg) {
            const ratio = logoImg.width / logoImg.height;
            ratio > 1 ? logoH = logoW / ratio : logoW = logoH * ratio;
        }

        // Crear una copia de los datos limpiando las URLs de imagen para que no salgan como texto en la primera columna si es Usuarios
        const cleanRows = rows.map(r => r.map((cell, i) => (isUserModule && i === 0) ? "" : cell));

        // Renombrar cabecera de imagen para que no se corte en el PDF
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
                // Renderizar imagen del usuario en la columna 0 si estamos en el módulo de usuarios
                if (isUserModule && data.section === 'body' && data.column.index === 0) {
                    const imgSrc = rows[data.row.index][0];
                    const imgObj = rowImagesMap[imgSrc];
                    if (imgObj) {
                        const size = 8;
                        const x = data.cell.x + (data.cell.width - size) / 2;
                        const y = data.cell.y + (data.cell.height - size) / 2;
                        const cx = x + size / 2;
                        const cy = y + size / 2;
                        const r = size / 2;
                        
                        // Fondo circular
                        if (imgSrc.includes('default_avatar')) {
                            doc.setFillColor(230, 255, 230);
                        } else {
                            doc.setFillColor(240, 240, 240);
                        }
                        doc.circle(cx, cy, r, 'F');
                        
                        // Clip circular para que la imagen se vea redondeada
                        doc.saveGraphicsState();
                        doc.circle(cx, cy, r, null);
                        doc.clip();
                        doc.discardPath();
                        doc.addImage(imgObj, 'JPEG', x, y, size, size);
                        doc.restoreGraphicsState();
                        
                        // Borde circular sutil
                        doc.setDrawColor(200, 200, 200);
                        doc.setLineWidth(0.2);
                        doc.circle(cx, cy, r, 'D');
                    }
                }
            },
            didDrawPage: (data) => {
                // Header Institucional - Diseño Lineal
                // Logo a la izquierda
                if (logoImg) doc.addImage(logoImg, 'PNG', 15, 10, logoW, logoH);

                // Título y subtítulo al lado del logo
                doc.setTextColor(0, 31, 63);
                doc.setFontSize(13);
                doc.setFont("helvetica", "bold");
                doc.text("GERENCIA DE TECNOLOGÍA", 40, 18, { align: "left" });

                doc.setTextColor(100, 100, 100);
                doc.setFontSize(7.5);
                doc.setFont("helvetica", "normal");
                doc.text("Sistema de Gestión WiFi VTV • Reporte de " + moduleTitle, 40, 23, { align: "left" });

                // Línea separadora
                doc.setDrawColor(0, 31, 63);
                doc.setLineWidth(0.5);
                doc.line(15, 32, 195, 32);


                // Barra de Fecha Azul
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

                // Barra de Cantidad de Registros
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
        const blob = doc.output('bloburl');
        const iframe = document.getElementById('pdfFrame');
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
    };



    let logoLoaded = false;
    let logoImg = null;
    
    // Capturar todas las imágenes únicas de la tabla
    const isUserModule = moduleTitle.includes("USUARIOS");
    const tableImgs = isUserModule ? Array.from(table.querySelectorAll('tbody tr td:nth-child(2) img')).map(img => img.src) : [];
    const uniqueTableImgs = [...new Set(tableImgs)].filter(x => x);
    const rowImagesMap = {};
    let loadedTableImgsCount = 0;

    const finalize = () => {
        if (logoLoaded && (loadedTableImgsCount >= uniqueTableImgs.length)) {
            generatePDF(logoImg, rowImagesMap);
        }
    };

    const imgLogo = new Image();
    imgLogo.crossOrigin = "Anonymous";
    imgLogo.src = logoUrl;
    imgLogo.onload = () => { logoImg = imgLogo; logoLoaded = true; finalize(); };
    imgLogo.onerror = () => { logoLoaded = true; finalize(); };



    if (uniqueTableImgs.length > 0) {
        uniqueTableImgs.forEach(url => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;
            img.onload = () => { rowImagesMap[url] = img; loadedTableImgsCount++; finalize(); };
            img.onerror = () => { loadedTableImgsCount++; finalize(); };
        });
    } else {
        finalize();
    }
};


