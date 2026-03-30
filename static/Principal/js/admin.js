/**
 * CYBER ADMIN DASHBOARD - MAIN LOGIC
 * Handles menu navigation, sidebar toggling, stats counters, and matrix background.
 */
let mainTableInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initNavigation();
    initCatalogos();
    actualizarEstadisticas();
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
    const bcCurrent = document.getElementById('bcCurrent');

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
            if (bcCurrent) {
                bcCurrent.textContent = targetSec.toUpperCase();
            }

            // Close mobile sidebar on navigation
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('mobile-open');
            }
        });
    });
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
        status:      u.estado  || 'ACTIVO'
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
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        pageLength: 6,
        lengthMenu: [6, 10, 25, 100],
        autoWidth: false,
        responsive: true,
        dom: '<"top"fl>rt<"bottom"ip><"clear">',
        drawCallback: function () {
            const info = mainTableInstance.page.info();
            const bcCurrent = document.getElementById('bcCurrent');
            if (bcCurrent) bcCurrent.textContent = `${info.recordsTotal} REGISTROS`;
        }
    });
}

function initOtherTables() {
    const PERFILES_MOCK = [
        { id: 201, name: 'Default_WiFi', bandwidth: '50 Mbps', priority: 'BAJA', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 202, name: 'VIP_Network', bandwidth: '150 Mbps', priority: 'ALTA', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 203, name: 'Guest_Public', bandwidth: '10 Mbps', priority: 'BAJA', status: 'SUSPENDIDO', lastAccess: '2024-03-01' },
    ];

    if ($('#perfilesTable').length) {
        $('#perfilesTable').DataTable({
            data: PERFILES_MOCK,
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
                { data: 'bandwidth' },
                { data: 'priority', render: (data) => `<span class="badge badge-${data.toLowerCase()}">${data}</span>` },
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
            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            pageLength: 6,
            lengthMenu: [6, 10, 25, 100],
            autoWidth: false,
            responsive: true,
            dom: '<"top"fl>rt<"bottom"ip><"clear">',
            drawCallback: function () {
                const countEl = document.getElementById('perfilesTableCount');
                if (countEl) countEl.textContent = `${this.api().page.info().recordsTotal} registros`;
            }
        });
    }

    const GERENCIAS_MOCK = [
        { id: 301, name: 'Gerencia General', level: 'Nivel 1', supervisor: 'Admin', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 302, name: 'Recursos Humanos', level: 'Nivel 2', supervisor: 'RRHH_Lead', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 303, name: 'Operaciones Técnicas', level: 'Nivel 2', supervisor: 'Tech_Lead', status: 'ACTIVO', lastAccess: '2024-03-01' },
    ];

    if ($('#gerenciasTable').length) {
        $('#gerenciasTable').DataTable({
            data: GERENCIAS_MOCK,
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
            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            pageLength: 6,
            lengthMenu: [6, 10, 25, 100],
            autoWidth: false,
            responsive: true,
            dom: '<"top"fl>rt<"bottom"ip><"clear">',
            drawCallback: function () {
                const countEl = document.getElementById('gerenciasTableCount');
                if (countEl) countEl.textContent = `${this.api().page.info().recordsTotal} registros`;
            }
        });
    }

    const DIVISIONES_MOCK = [
        { id: 401, name: 'División de Desarrollo', level: 'Nivel 3', supervisor: 'Dev_Lead', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 402, name: 'División de Soporte', level: 'Nivel 3', supervisor: 'Support_Lead', status: 'ACTIVO', lastAccess: '2024-03-02' },
        { id: 403, name: 'División de Redes', level: 'Nivel 3', supervisor: 'Net_Lead', status: 'ACTIVO', lastAccess: '2024-03-01' },
    ];

    if ($('#divisionesTable').length) {
        $('#divisionesTable').DataTable({
            data: DIVISIONES_MOCK,
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
            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            pageLength: 6,
            lengthMenu: [6, 10, 25, 100],
            autoWidth: false,
            responsive: true,
            dom: '<"top"fl>rt<"bottom"ip><"clear">',
            drawCallback: function () {
                const countEl = document.getElementById('divisionesTableCount');
                if (countEl) countEl.textContent = `${this.api().page.info().recordsTotal} registros`;
            }
        });
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
            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            pageLength: 6,
            lengthMenu: [6, 10, 25, 100],
            autoWidth: false,
            responsive: true,
            dom: '<"top"fl>rt<"bottom"ip><"clear">',
            drawCallback: function () {
                const countEl = document.getElementById('marcasTableCount');
                if (countEl) countEl.textContent = `${this.api().page.info().recordsTotal} registros`;
            }
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
            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            pageLength: 6,
            lengthMenu: [6, 10, 25, 100],
            autoWidth: false,
            responsive: true,
            dom: '<"top"fl>rt<"bottom"ip><"clear">',
            drawCallback: function () {
                const countEl = document.getElementById('ubicacionTableCount');
                if (countEl) countEl.textContent = `${this.api().page.info().recordsTotal} registros`;
            }
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
            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            pageLength: 6,
            lengthMenu: [6, 10, 25, 100],
            autoWidth: false,
            responsive: true,
            dom: '<"top"fl>rt<"bottom"ip><"clear">',
            drawCallback: function () {
                const countEl = document.getElementById('wifiTableCount');
                if (countEl) countEl.textContent = `${this.api().page.info().recordsTotal} registros`;
            }
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
            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            pageLength: 6,
            lengthMenu: [6, 10, 25, 100],
            autoWidth: false,
            responsive: true,
            dom: '<"top"fl>rt<"bottom"ip><"clear">',
            drawCallback: function () {
                const countEl = document.getElementById('auditoriaTableCount');
                if (countEl) countEl.textContent = `${this.api().page.info().recordsTotal} registros`;
            }
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
            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            pageLength: 6,
            lengthMenu: [6, 10, 25, 100],
            autoWidth: false,
            responsive: true,
            dom: '<"top"fl>rt<"bottom"ip><"clear">',
            drawCallback: function () {
                const countEl = document.getElementById('auditoriaWifiTableCount');
                if (countEl) countEl.textContent = `${this.api().page.info().recordsTotal} registros`;
            }
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
    const globalSearch = document.getElementById('globalSearch');
    const tableSearch = document.getElementById('tableSearch');

    function performSearch(val) {
        if (globalSearch) globalSearch.value = val;
        if (tableSearch) tableSearch.value = val;
        if (mainTableInstance) {
            mainTableInstance.search(val).draw();
        }
    }

    if (globalSearch) {
        globalSearch.addEventListener('input', (e) => performSearch(e.target.value));
    }
    if (tableSearch) {
        tableSearch.addEventListener('input', (e) => performSearch(e.target.value));
    }
}

// --- MODAL HELPERS ---
window.showModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
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
            setValue('eEditId',     u.id);
            setValue('eFirstName',  u.primer_nombre);
            setValue('eLastName',   u.primer_apellido);
            setValue('eUsername',   u.usuario);
            setValue('eCedula',     u.cedula);
            setValue('ePhone',      u.telefono);
            setValue('eProfile',    u.id_perfil);
            setValue('eStatus',     u.id_estado);
            setValue('eGerencia',   u.id_gerencia);
            
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

window.showAlert = (msg) => {
    const msgEl = document.getElementById('alertMessage');
    if (msgEl) msgEl.textContent = msg;
    showModal('modalAlert');
};

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
    cargarSelectDesdeApi('/api/gerencias', ['fGerencia', 'eGerencia', 'vGerencia'], 'id', 'nombre');
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
                    // Opcional: podrías disparar aquí la animación de conteo si existe
                }
            };
            animateValue('statActivos',    s.activos    || 0);
            animateValue('statInactivos',  s.inactivos  || 0);
            animateValue('statBloqueados', s.bloqueados || 0);
            animateValue('statTotal',      s.total      || 0);
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

function initTerminal() {
    const container = document.getElementById('terminal-container');
    if (!container) return;

    // Create Terminal
    terminal = new Terminal({
        cursorBlink: true,
        theme: {
            background: '#000000',
            foreground: '#00ff41',
            cursor: '#00ff41',
            selectionBackground: 'rgba(0, 255, 65, 0.3)'
        },
        fontSize: 14,
        fontFamily: 'Courier New, monospace'
    });

    terminalFit = new FitAddon.FitAddon();
    terminal.loadAddon(terminalFit);
    terminal.open(container);
    terminalFit.fit();

    // Initial greeting
    terminal.writeln('\x1b[1;32m[SYSTEM]\x1b[0m Núcleo de comunicaciones activo.');
    terminal.writeln('\x1b[1;32m[SYSTEM]\x1b[0m Sesión para: \x1b[1;37madmin\x1b[0m');
    terminal.write('\r\nroot@vtv:~# ');

    // Capture Keys
    terminal.onData(data => {
        const charCode = data.charCodeAt(0);
        if (charCode === 13) { // Enter
            terminal.write('\r\n');
            handleCommand(currentLine);
            currentLine = '';
        } else if (charCode === 127) { // Backspace
            if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1);
                terminal.write('\b \b');
            }
        } else if (charCode < 32 && charCode !== 27) {
            // Unhandled control chars
        } else {
            currentLine += data;
            terminal.write(data);
        }
    });

    // Resize handling
    window.addEventListener('resize', () => {
        if (terminalFit) terminalFit.fit();
    });
}

function handleCommand(cmd) {
    const trimmed = cmd.trim();

    if (trimmed.toLowerCase() === 'clear') {
        terminal.clear();
        terminal.write('root@vtv:~# ');
        return;
    }

    if (trimmed.toLowerCase() === 'exit') {
        window.closeModal('modalTerminal');
        terminal.write('root@vtv:~# ');
        return;
    }

    if (trimmed === '') {
        terminal.write('root@vtv:~# ');
        return;
    }

    // Call Real Terminal API
    fetch('api/terminal.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed })
    })
        .then(res => res.json())
        .then(data => {
            if (data.output) {
                // Replace newlines with CRLF for Xterm
                const formatted = data.output.replace(/\n/g, '\r\n');
                terminal.writeln(formatted);
            }
            terminal.write('root@vtv:~# ');
        })
        .catch(err => {
            terminal.writeln('\x1b[1;31mERROR_CONEXIÓN:\x1b[0m No se pudo contactar con el núcleo.');
            terminal.write('root@vtv:~# ');
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
