
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    document.getElementById('clock').textContent = `${strHours}:${minutes}:${seconds} ${ampm}`;
}
setInterval(updateClock, 1000); updateClock();

const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

const CHARS = 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF'.split('');
const FS = 14;
let cols, drops;

// Pre-render characters to offscreen canvas (much faster than fillText each frame)
const charCanvases = [];
const offCtx = document.createElement('canvas').getContext('2d');
offCtx.canvas.width = FS;
offCtx.canvas.height = FS;
offCtx.font = `${FS}px "Courier New",monospace`;
offCtx.textBaseline = 'top';
offCtx.fillStyle = '#b0ffb0';
for (let i = 0; i < CHARS.length; i++) {
    const c = document.createElement('canvas');
    c.width = FS; c.height = FS;
    const cx = c.getContext('2d');
    cx.font = `${FS}px "Courier New",monospace`;
    cx.textBaseline = 'top';
    cx.fillStyle = '#b0ffb0';
    cx.fillText(CHARS[i], 0, 0);
    charCanvases.push(c);
}

function initRain() {
    cols = Math.floor(canvas.width / FS) + 1;
    drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -50));
}
initRain();
window.addEventListener('resize', () => { resize(); initRain(); });

let lastFrame = 0;
const FPS_INTERVAL = 1000 / 30;

function draw(timestamp) {
    requestAnimationFrame(draw);

    const elapsed = timestamp - lastFrame;
    if (elapsed < FPS_INTERVAL) return;
    lastFrame = timestamp - (elapsed % FPS_INTERVAL);

    ctx.fillStyle = 'rgba(0,10,2,0.14)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < cols; i++) {
        const ci = Math.floor(Math.random() * charCanvases.length);
        const x = i * FS;
        const y = drops[i] * FS;

        ctx.drawImage(charCanvases[ci], x, y);

        if (y > canvas.height && Math.random() > 0.975) {
            drops[i] = Math.floor(Math.random() * -10);
        }
        drops[i] += 0.6;
    }
}
requestAnimationFrame(draw);

const form = document.getElementById('loginForm');
const userEl = document.getElementById('username');
const passEl = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const toggleBtn = document.getElementById('togglePass');
const eyeOpen = document.getElementById('eyeOpen');
const eyeClosed = document.getElementById('eyeClosed');
const glitchOv = document.getElementById('glitchOverlay');

toggleBtn.addEventListener('click', () => {
    const show = passEl.type === 'password';
    passEl.type = show ? 'text' : 'password';
    eyeOpen.style.display = show ? 'none' : 'block';
    eyeClosed.style.display = show ? 'block' : 'none';
});

function glitch() {
    glitchOv.classList.remove('fire');
    void glitchOv.offsetWidth;
    glitchOv.classList.add('fire');
}

function setErr(groupId, errId, msg) { document.getElementById(groupId).classList.add('has-error'); document.getElementById(errId).textContent = msg; }
function clearErr(groupId, errId) { document.getElementById(groupId).classList.remove('has-error'); document.getElementById(errId).textContent = ''; }

// ── Toast notification system ──
const toastContainer = document.getElementById('toastContainer');

function showToast(title, message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
                <div class="toast-glitch"></div>
                <div class="toast-icon">⚠</div>
                <div class="toast-body">
                    <div class="toast-title">${title}</div>
                    <div class="toast-msg">${message}</div>
                </div>
                <button class="toast-close" onclick="dismissToast(this.parentElement)">✕</button>
            `;
    toastContainer.appendChild(toast);
    glitch();

    // Auto remove after 4 seconds
    const timer = setTimeout(() => dismissToast(toast), 4000);
    toast.addEventListener('click', () => { clearTimeout(timer); dismissToast(toast); });
}

function dismissToast(toast) {
    if (!toast || toast.classList.contains('removing')) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
}

userEl.addEventListener('input', () => clearErr('g-user', 'userError'));
passEl.addEventListener('input', () => clearErr('g-pass', 'passError'));

function validate() {
    let ok = true;
    const errors = [];
    const u = userEl.value.trim(), p = passEl.value;

    if (!u) {
        setErr('g-user', 'userError', '[ CAMPO REQUERIDO ]');
        errors.push('Ingrese su nombre de usuario');
        ok = false;
    }

    if (!p) {
        setErr('g-pass', 'passError', '[ CAMPO REQUERIDO ]');
        errors.push('Ingrese su contraseña');
        ok = false;
    } else {
        const hasLetter = /[a-zA-Z]/.test(p);
        const hasNumber = /[0-9]/.test(p);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p);
        if (!hasLetter || !hasNumber || !hasSpecial) {
            const missing = [];
            if (!hasLetter) missing.push('letras');
            if (!hasNumber) missing.push('números');
            if (!hasSpecial) missing.push('carácter especial');
            setErr('g-pass', 'passError', '[ CONTRASEÑA DÉBIL ]');
            errors.push('La contraseña debe contener: ' + missing.join(', '));
            ok = false;
        } else if (p.length < 6) {
            setErr('g-pass', 'passError', '[ MUY CORTA ]');
            errors.push('La contraseña debe tener al menos 6 caracteres');
            ok = false;
        }
    }

    if (!ok) {
        showToast('ERROR DE VALIDACIÓN', errors.join(' · '));
    }

    return ok;
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    glitch();

    await new Promise(r => setTimeout(r, 1600));

    form.style.transition = 'opacity .2s,transform .2s';
    form.style.opacity = '0'; form.style.transform = 'scale(.96)';
    setTimeout(() => {
        form.style.display = 'none';
        document.querySelector('.divider').style.display = 'none';
        document.querySelector('.panel-footer').style.display = 'none';
        const ss = document.getElementById('successScreen');
        ss.classList.add('show');
        glitch();

        // Redirigir al panel de administración después de 2 segundos de lectura
        setTimeout(() => {
            window.location.href = '../Principal/index.html';
        }, 2000);
    }, 200);
});
