// ============================================================
//  MATRIX RAIN – Balanced, not overwhelming
// ============================================================
class MatrixRain {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.id = 'matrixCanvas';

        Object.assign(this.canvas.style, {
            position: 'fixed', top: '0', left: '0',
            width: '100%', height: '100%',
            zIndex: '0', pointerEvents: 'none',
            background: '#000000',
        });
        document.body.prepend(this.canvas);

        // Half-width katakana + numbers — classic Matrix look
        this.chars = (
            'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ' +
            '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        ).split('');

        // ── Tune these to change the feel ─────────────────────
        this.fontSize = 16;   // px — controls column count
        this.density = 0.42; // 0–1: fraction of columns active
        this.minSpeed = 0.20; // chars/frame slowest
        this.maxSpeed = 0.55; // chars/frame fastest
        this.minLen = 8;    // shortest trail (chars)
        this.maxLen = 18;   // longest trail (chars)
        this.fadeAlpha = 0.09; // overlay — lower = longer trails
        // ──────────────────────────────────────────────────────

        this.columns = 0;
        this.streams = [];

        // Mouse effect
        this.mouseX = -9999;
        this.mouseY = -9999;
        this.mouseRadius = 140;
        this.mouseActive = false;
        this.mouseDecay = 0;

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX; this.mouseY = e.clientY;
            this.mouseActive = true; this.mouseDecay = 1.0;
        });
        window.addEventListener('mouseleave', () => { this.mouseActive = false; });

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    rc() { return this.chars[Math.floor(Math.random() * this.chars.length)]; }

    newStream(col) {
        const len = this.minLen + Math.floor(Math.random() * (this.maxLen - this.minLen));
        return {
            col,
            active: Math.random() < this.density,
            y: -(2 + Math.floor(Math.random() * 50)),
            speed: this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed),
            len,
            chars: Array.from({ length: len }, () => this.rc()),
        };
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const cols = Math.floor(this.canvas.width / this.fontSize);
        if (cols > this.columns) {
            for (let i = this.columns; i < cols; i++) this.streams.push(this.newStream(i));
        } else {
            this.streams = this.streams.filter(s => s.col < cols);
        }
        this.columns = cols;
    }

    animate() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height, fs = this.fontSize;

        ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);

        if (!this.mouseActive && this.mouseDecay > 0)
            this.mouseDecay = Math.max(0, this.mouseDecay - 0.025);

        ctx.font = `${fs}px 'Courier New', monospace`;

        for (const s of this.streams) {
            s.y += s.speed;

            // Recycle when trail fully exits bottom
            if ((s.y - s.len) * fs > H) {
                Object.assign(s, this.newStream(s.col));
                continue;
            }

            if (!s.active) continue;

            const x = s.col * fs;
            const headY = s.y * fs;

            // Mouse proximity: 0 = far, 1 = on top
            const dx = x + fs / 2 - this.mouseX;
            const dy = headY - this.mouseY;
            const inf = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / this.mouseRadius) * this.mouseDecay;

            // Small extra push near cursor (max 2×)
            if (inf > 0) s.y += s.speed * inf * 1.2;

            // Occasional character shimmer
            if (Math.random() < 0.15)
                s.chars[Math.floor(Math.random() * s.len)] = this.rc();

            for (let j = 0; j < s.chars.length; j++) {
                const cy = (s.y - j) * fs;
                if (cy < -fs || cy > H) continue;

                const t = j / Math.max(1, s.chars.length - 1); // 0=head 1=tail
                ctx.shadowBlur = 0;

                if (j === 0) {
                    // HEAD — bright green, soft glow
                    ctx.shadowColor = '#00ff41';
                    ctx.shadowBlur = inf > 0.08 ? 5 + inf * 8 : 2;
                    ctx.fillStyle = `rgba(145, 255, 145, ${0.88 + inf * 0.12})`;
                } else if (j === 1) {
                    ctx.fillStyle = 'rgba(0, 210, 55, 0.80)';
                } else if (j <= 5) {
                    // Upper body — medium green
                    const g = Math.round(190 - t * 90);
                    ctx.fillStyle = `rgba(0, ${g}, 28, ${0.70 - t * 0.15})`;
                } else {
                    // Lower body → tail — fades out
                    const g = Math.round(160 - t * 150);
                    const a = Math.max(0, 0.65 - t * 0.82);
                    ctx.fillStyle = `rgba(0, ${g}, 10, ${a})`;
                }
                ctx.fillText(s.chars[j], x, cy);
            }
            ctx.shadowBlur = 0;
        }

        // Soft radial glow at cursor
        if (this.mouseDecay > 0) {
            const g = ctx.createRadialGradient(
                this.mouseX, this.mouseY, 0,
                this.mouseX, this.mouseY, this.mouseRadius
            );
            g.addColorStop(0, `rgba(0,210,55, ${0.06 * this.mouseDecay})`);
            g.addColorStop(0.6, `rgba(0,140,30, ${0.02 * this.mouseDecay})`);
            g.addColorStop(1, 'rgba(0,200,50, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(this.mouseX, this.mouseY, this.mouseRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }
}

// ============================================================
//  NEON CYBER LOGIN FORM
// ============================================================
class NeonCyberLoginForm {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.submitButton = this.form.querySelector('.neon-button');
        this.successMessage = document.getElementById('successMessage');
        this.socialButtons = document.querySelectorAll('.social-matrix');
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupPasswordToggle();
        this.setupSocialButtons();
        this.setupCyberEffects();
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        this.emailInput.addEventListener('input', () => this.clearError('email'));
        this.passwordInput.addEventListener('input', () => this.clearError('password'));
        this.emailInput.setAttribute('placeholder', ' ');
        this.passwordInput.setAttribute('placeholder', ' ');
    }

    setupPasswordToggle() {
        this.passwordToggle.addEventListener('click', () => {
            const type = this.passwordInput.type === 'password' ? 'text' : 'password';
            this.passwordInput.type = type;
            this.passwordToggle.classList.toggle('toggle-active', type === 'text');
            this.triggerCyberGlitch(this.passwordToggle);
        });
    }

    setupSocialButtons() {
        this.socialButtons.forEach(button => {
            button.addEventListener('click', () => {
                const provider = button.querySelector('span').textContent.trim();
                this.handleSocialLogin(provider, button);
            });
        });
    }

    setupCyberEffects() {
        [this.emailInput, this.passwordInput].forEach(input => {
            input.addEventListener('focus', (e) => this.triggerCyberScan(e.target.closest('.cyber-field')));
            input.addEventListener('blur', (e) => this.stopCyberScan(e.target.closest('.cyber-field')));
        });
        this.startRandomGlitches();
    }

    triggerCyberScan(field) { field.querySelector('.cyber-scanner').style.opacity = '1'; }
    stopCyberScan(field) { field.querySelector('.cyber-scanner').style.opacity = '0.3'; }

    triggerCyberGlitch(element) {
        element.style.filter = 'hue-rotate(180deg)';
        setTimeout(() => { element.style.filter = ''; }, 200);
    }

    startRandomGlitches() {
        setInterval(() => {
            const tg = document.querySelector('.title-glitch');
            if (Math.random() < 0.1) {
                tg.style.animation = 'none';
                tg.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
                tg.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
                setTimeout(() => { tg.style.animation = ''; tg.style.transform = ''; tg.style.filter = ''; }, 100);
            }
        }, 2000);
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        if (!email) { this.showError('email', '[ ERROR: EMAIL_REQUIRED ]'); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.showError('email', '[ ERROR: INVALID_FORMAT ]'); return false; }
        this.clearError('email'); return true;
    }

    validatePassword() {
        const pw = this.passwordInput.value;
        if (!pw) { this.showError('password', '[ ERROR: ACCESS_CODE_REQUIRED ]'); return false; }
        if (pw.length < 6) { this.showError('password', '[ ERROR: CODE_TOO_SHORT ]'); return false; }
        this.clearError('password'); return true;
    }

    showError(field, message) {
        const cf = document.getElementById(field).closest('.cyber-field');
        const er = document.getElementById(`${field}Error`);
        cf.classList.add('error');
        er.textContent = message;
        er.classList.add('show');
        this.triggerCyberGlitch(cf);
    }

    clearError(field) {
        const cf = document.getElementById(field).closest('.cyber-field');
        const er = document.getElementById(`${field}Error`);
        cf.classList.remove('error');
        er.classList.remove('show');
        setTimeout(() => { er.textContent = ''; }, 300);
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (!this.validateEmail() | !this.validatePassword()) { this.triggerSystemGlitch(); return; }
        this.setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 3000));
            this.showMatrixSuccess();
        } catch { this.showError('password', '[ ERROR: CONNECTION_FAILED ]'); }
        finally { this.setLoading(false); }
    }

    async handleSocialLogin(provider, button) {
        const orig = button.innerHTML;
        button.style.pointerEvents = 'none'; button.style.opacity = '0.7';
        button.innerHTML = `
            <div class="social-frame"></div>
            <div style="display:flex;gap:2px;">
                <div style="width:2px;height:12px;background:#00ff41;animation:matrixPulse 1.2s ease-in-out infinite;"></div>
                <div style="width:2px;height:12px;background:#00ff41;animation:matrixPulse 1.2s ease-in-out infinite;animation-delay:.1s;"></div>
                <div style="width:2px;height:12px;background:#00ff41;animation:matrixPulse 1.2s ease-in-out infinite;animation-delay:.2s;"></div>
                <div style="width:2px;height:12px;background:#00ff41;animation:matrixPulse 1.2s ease-in-out infinite;animation-delay:.3s;"></div>
            </div>
            <span>CONNECTING...</span>
            <div class="social-glow"></div>`;
        try { await new Promise(r => setTimeout(r, 2500)); }
        finally { button.style.pointerEvents = 'auto'; button.style.opacity = '1'; button.innerHTML = orig; }
    }

    setLoading(loading) {
        this.submitButton.classList.toggle('loading', loading);
        this.submitButton.disabled = loading;
        this.socialButtons.forEach(b => {
            b.style.pointerEvents = loading ? 'none' : 'auto';
            b.style.opacity = loading ? '0.5' : '1';
        });
        if (loading) this.startLoadingGlitches();
    }

    startLoadingGlitches() {
        const iv = setInterval(() => {
            if (!this.submitButton.classList.contains('loading')) { clearInterval(iv); return; }
            const t = document.querySelector('.cyber-terminal');
            t.style.filter = 'hue-rotate(180deg)';
            setTimeout(() => { t.style.filter = ''; }, 50);
        }, 500);
    }

    triggerSystemGlitch() {
        const t = document.querySelector('.cyber-terminal');
        t.style.transform = 'translate(2px,-1px)'; t.style.filter = 'hue-rotate(270deg)';
        setTimeout(() => { t.style.transform = ''; t.style.filter = ''; }, 200);
    }

    showMatrixSuccess() {
        this.form.style.transform = 'scale(0.9)';
        this.form.style.opacity = '0';
        this.form.style.filter = 'blur(2px)';
        setTimeout(() => {
            this.form.style.display = 'none';
            document.querySelector('.matrix-social').style.display = 'none';
            document.querySelector('.matrix-signup').style.display = 'none';
            document.querySelector('.cyber-divider').style.display = 'none';
            this.successMessage.classList.add('show');
            this.triggerSuccessGlitch();
        }, 300);
        setTimeout(() => { console.log('[ ACCESS_GRANTED ]'); }, 4000);
    }

    triggerSuccessGlitch() {
        setTimeout(() => {
            const st = document.querySelector('.success-title');
            st.style.animation = 'textGlitch 0.5s ease-in-out';
            setTimeout(() => { st.style.animation = ''; }, 500);
        }, 1500);
    }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    new MatrixRain();
    new NeonCyberLoginForm();
});