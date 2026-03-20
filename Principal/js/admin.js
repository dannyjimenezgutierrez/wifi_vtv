/**
 * CYBER ADMIN DASHBOARD - MAIN LOGIC
 * Handles menu navigation, sidebar toggling, stats counters, and matrix background.
 */
let mainTableInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initNavigation();
    initStats();
    initTable();
    initMatrixBackground();
    initSearch();
    initTerminal();
});

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
const MOCK_DATA = [
    { id: 1024, username: 'neo_anderson', email: 'neo@matrix.net', role: 'ADMIN', status: 'ACTIVO', lastAccess: '2024-03-02 18:45' },
    { id: 1025, username: 'trinity_v', email: 'trinity@zion.org', role: 'ADMIN', status: 'ACTIVO', lastAccess: '2024-03-02 17:30' },
    { id: 1026, username: 'morpheus_sub', email: 'morpheus@nebuchadnezzar.com', role: 'OPERADOR', status: 'ACTIVO', lastAccess: '2024-03-01 12:00' },
    { id: 1027, username: 'agent_smith', email: 'smith@system.com', role: 'AUDITOR', status: 'SUSPENDIDO', lastAccess: 'N/A' },
    { id: 1028, username: 'cypher_rat', email: 'cypher@traitor.net', role: 'INVITADO', status: 'INACTIVO', lastAccess: '2024-02-28 09:15' },
    { id: 1029, username: 'oracle_v7', email: 'oracle@source.com', role: 'AUDITOR', status: 'ACTIVO', lastAccess: '2024-03-02 20:00' },
];

function initTable() {
    mainTableInstance = $('#mainTable').DataTable({
        data: MOCK_DATA,
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
                render: (data) => `<span class="font-mono">#${data}</span>`
            },
            {
                data: 'username',
                render: (data) => `<span class="font-bold text-green">${data}</span>`
            },
            { data: 'email' },
            {
                data: 'role',
                render: (data) => `<span class="badge badge-${data.toLowerCase()}">${data}</span>`
            },
            {
                data: 'status',
                render: (data) => `<span class="status-indicator status-${data.toLowerCase()}">${data}</span>`
            },
            {
                data: 'lastAccess',
                render: (data) => `<span class="font-mono text-small">${data}</span>`
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (data, type, row) => `
                    <div class="row-actions">
                        <button class="btn btn-outline btn-sm" title="Ver" onclick="viewRecord(${row.id})">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/></svg>
                        </button>
                        <button class="btn btn-outline btn-sm" title="Editar" onclick="editRecord(${row.id})">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 015 12.5V12h-.5a.5.5 0 01-.5-.5V11h-.5a.5.5 0 01-.468-.325z"/></svg>
                        </button>
                        <button class="btn btn-outline btn-sm btn-outline-red" title="Eliminar" onclick="deleteRecord('${row.username}')">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" clip-rule="evenodd"/></svg>
                        </button>
                        <button class="btn btn-outline btn-sm" title="Terminal" onclick="openTerminal('${row.username}')">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M6 9a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3A.5.5 0 016 9zM3.854 4.146a.5.5 0 10-.708.708L4.793 6.5 3.146 8.146a.5.5 0 10.708.708l2-2a.5.5 0 000-.708l-2-2z"/></svg>
                        </button>
                    </div>
                `
            }
        ],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        pageLength: 10,
        dom: '<"top"f>rt<"bottom"ip><"clear">',
        drawCallback: function () {
            // Update custom counter if needed
            const countEl = document.getElementById('tableCount');
            if (countEl) {
                const info = mainTableInstance.page.info();
                countEl.textContent = `${info.recordsTotal} registros`;
            }
        }
    });
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

// --- CRUD PLACEHOLDERS ---
window.viewRecord = (id) => {
    const record = MOCK_DATA.find(r => r.id === id);
    const body = document.getElementById('modalViewBody');
    if (body && record) {
        body.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item"><label>ID</label><span>#${record.id}</span></div>
                <div class="detail-item"><label>USUARIO</label><span>${record.username}</span></div>
                <div class="detail-item"><label>EMAIL</label><span>${record.email}</span></div>
                <div class="detail-item"><label>ROL</label><span>${record.role}</span></div>
                <div class="detail-item"><label>ESTADO</label><span>${record.status}</span></div>
            </div>
        `;
        showModal('modalView');
    }
};

window.deleteRecord = (name) => {
    const target = document.getElementById('deleteTarget');
    if (target) target.textContent = name;
    showModal('modalDelete');
};

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

// --- TERMINAL LOGIC ---
function initTerminal() {
    const input = document.getElementById('terminalInput');
    const display = document.querySelector('.terminal-input-display');
    const container = document.getElementById('terminalOutput');

    if (!input || !display) return;

    // Keep focus on input when clicking terminal
    container.addEventListener('click', () => {
        if (input) input.focus();
    });

    input.addEventListener('input', (e) => {
        if (display) display.textContent = e.target.value;
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.trim().toLowerCase();
            handleCommand(cmd);
            input.value = '';
            if (display) display.textContent = '';
        }
    });
}

window.openTerminal = (username) => {
    const termUser = document.getElementById('termUser');
    if (termUser) termUser.textContent = username;

    showModal('modalTerminal');

    // Focus after modal animation
    setTimeout(() => {
        const input = document.getElementById('terminalInput');
        if (input) input.focus();
    }, 100);
};

function handleCommand(cmd) {
    const output = document.getElementById('terminalOutput');
    const inputLine = output ? output.querySelector('.terminal-input-line') : null;

    if (!output || !inputLine) return;

    // Log command
    const cmdLine = document.createElement('div');
    cmdLine.className = 'terminal-line';
    cmdLine.innerHTML = `<span class="terminal-prompt">root@cypher_net:~#</span> ${cmd}`;
    output.insertBefore(cmdLine, inputLine);

    const response = document.createElement('div');
    response.className = 'terminal-line';

    switch (cmd) {
        case 'help':
            response.innerHTML = `Comandos disponibles:<br>
                - clear: Limpiar pantalla<br>
                - status: Estado del sistema<br>
                - whoami: Identidad actual<br>
                - ls: Listar archivos del nodo<br>
                - exit: Cerrar terminal`;
            break;
        case 'clear':
            const allLines = output.querySelectorAll('.terminal-line:not(.terminal-input-line)');
            allLines.forEach(l => l.remove());
            return;
        case 'status':
            response.innerHTML = `[OK] Núcleo: Operativo<br>[OK] Base de Datos: Enlazada<br>[OK] Firewall: Activo (Nivel 5)`;
            break;
        case 'whoami':
            const user = document.getElementById('termUser').textContent;
            response.innerHTML = `Usuario actual: ${user} (Privilegios de root)`;
            break;
        case 'ls':
            response.innerHTML = `system.log&nbsp;&nbsp;users.db&nbsp;&nbsp;config.json&nbsp;&nbsp;firewall_v2.sh`;
            break;
        case 'exit':
            closeModal('modalTerminal');
            return;
        case '':
            return;
        default:
            response.innerHTML = `<span class="text-red">ERROR: Comando '${cmd}' no reconocido. Escriba 'help'.</span>`;
    }

    output.insertBefore(response, inputLine);
    output.scrollTop = output.scrollHeight;
}
