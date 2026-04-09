
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

// ── CAPTCHA System ──
const captchaCanvas = document.getElementById('captchaCanvas');
const captchaCtx = captchaCanvas.getContext('2d');
const captchaInput = document.getElementById('captchaInput');
const refreshBtn = document.getElementById('refreshCaptcha');
let currentCaptcha = '';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCaptchaCode(length = 5) {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
    }
    return code;
}

function renderCaptcha() {
    currentCaptcha = generateCaptchaCode();
    const W = captchaCanvas.width;
    const H = captchaCanvas.height;

    // Dark background
    captchaCtx.fillStyle = 'rgba(0, 10, 3, 1)';
    captchaCtx.fillRect(0, 0, W, H);

    // Grid pattern
    captchaCtx.strokeStyle = 'rgba(0, 255, 65, 0.04)';
    captchaCtx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 12) {
        captchaCtx.beginPath(); captchaCtx.moveTo(x, 0); captchaCtx.lineTo(x, H); captchaCtx.stroke();
    }
    for (let y = 0; y < H; y += 12) {
        captchaCtx.beginPath(); captchaCtx.moveTo(0, y); captchaCtx.lineTo(W, y); captchaCtx.stroke();
    }

    // Interference lines
    for (let i = 0; i < 4; i++) {
        captchaCtx.beginPath();
        captchaCtx.strokeStyle = `rgba(0, 255, 65, ${0.08 + Math.random() * 0.12})`;
        captchaCtx.lineWidth = Math.random() * 1.5 + 0.5;
        const y1 = Math.random() * H;
        const y2 = Math.random() * H;
        captchaCtx.moveTo(0, y1);
        captchaCtx.bezierCurveTo(W * 0.33, y2, W * 0.66, y1, W, y2);
        captchaCtx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 60; i++) {
        captchaCtx.fillStyle = `rgba(0, 255, 65, ${Math.random() * 0.3})`;
        const size = Math.random() * 2;
        captchaCtx.fillRect(Math.random() * W, Math.random() * H, size, size);
    }

    // Render each character with individual transforms
    const charWidth = W / (currentCaptcha.length + 1.5);
    const fonts = ['Orbitron', 'Share Tech Mono', 'Courier New'];

    for (let i = 0; i < currentCaptcha.length; i++) {
        captchaCtx.save();

        const x = charWidth * (i + 1);
        const y = H / 2 + (Math.random() * 8 - 4);
        const angle = (Math.random() - 0.5) * 0.4;
        const scale = 0.85 + Math.random() * 0.35;
        const font = fonts[Math.floor(Math.random() * fonts.length)];

        captchaCtx.translate(x, y);
        captchaCtx.rotate(angle);
        captchaCtx.scale(scale, scale);

        // Glow shadow
        captchaCtx.shadowColor = 'rgba(0, 255, 65, 0.8)';
        captchaCtx.shadowBlur = 6 + Math.random() * 8;

        // Character color with slight variation
        const brightness = 180 + Math.floor(Math.random() * 75);
        captchaCtx.fillStyle = `rgb(0, ${brightness}, ${Math.floor(brightness * 0.25)})`;
        captchaCtx.font = `bold ${16 + Math.random() * 6}px "${font}", monospace`;
        captchaCtx.textAlign = 'center';
        captchaCtx.textBaseline = 'middle';
        captchaCtx.fillText(currentCaptcha[i], 0, 0);

        // Chromatic aberration effect
        captchaCtx.shadowBlur = 0;
        captchaCtx.globalAlpha = 0.15;
        captchaCtx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        captchaCtx.fillText(currentCaptcha[i], 1.5, -0.5);
        captchaCtx.fillStyle = 'rgba(255, 0, 50, 0.3)';
        captchaCtx.fillText(currentCaptcha[i], -1, 0.5);
        captchaCtx.globalAlpha = 1;

        captchaCtx.restore();
    }

    // Top and bottom glitch bars
    for (let i = 0; i < 2; i++) {
        const barY = Math.random() * H;
        const barH = 1 + Math.random() * 2;
        captchaCtx.fillStyle = `rgba(0, 255, 65, ${0.05 + Math.random() * 0.1})`;
        captchaCtx.fillRect(0, barY, W, barH);
    }
}

refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    clearErr('g-captcha', 'captchaError');
    captchaInput.value = '';
    renderCaptcha();
    setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
});

// Initialize captcha
renderCaptcha();

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
captchaInput.addEventListener('input', () => clearErr('g-captcha', 'captchaError'));

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

    // Captcha validation
    const captchaVal = captchaInput.value.trim().toUpperCase();
    if (!captchaVal) {
        setErr('g-captcha', 'captchaError', '[ CAMPO REQUERIDO ]');
        errors.push('Ingrese el código de verificación');
        ok = false;
    } else if (captchaVal !== currentCaptcha) {
        setErr('g-captcha', 'captchaError', '[ CÓDIGO INCORRECTO ]');
        errors.push('El código de verificación no coincide');
        ok = false;
        // Regenerate captcha on wrong input
        renderCaptcha();
        captchaInput.value = '';
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
