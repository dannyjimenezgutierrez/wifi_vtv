from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)

app.secret_key = 'vtv_wifi_2026'

# ── LOGIN ──────────────────────────────────────────────────────
@app.route('/')
def login():
    if 'usuario' in session:
        return redirect(url_for('principal'))
    return render_template('Login/index.html')

# ── VALIDAR LOGIN DESDE JAVASCRIPT ────────────────────────────
@app.route('/entrar', methods=['POST'])
def entrar():
    datos = request.get_json()
    usuario = datos.get('usuario')
    password = datos.get('password')

    if usuario == 'danny' and password == 'Danny16029567*':
        session['usuario'] = usuario
        return jsonify({'ok': True, 'redirigir': '/principal'})
    else:
        return jsonify({'ok': False, 'mensaje': 'Usuario o clave incorrecta'})

import requests
from datetime import datetime

# ── PRINCIPAL ─────────────────────────────────────────────────
@app.route('/principal')
def principal():
    if 'usuario' not in session:
        return redirect(url_for('login'))
        
    now = datetime.now()
    hora = now.strftime('%I:%M:%S %p')
    fecha = now.strftime('%d/%m/%Y')
    
    user_ip = request.remote_addr or '127.0.0.1'
    isp_name = "DESCONOCIDO"
    
    try:
        # Se obtiene telemetría de red simulando lo que haría el script JS
        res = requests.get('http://ip-api.com/json/', timeout=2)
        if res.status_code == 200:
            data = res.json()
            isp = data.get('isp', '').upper()
            if 'CANTV' in isp:
                isp_name = 'CANTV'
            elif 'INTER' in isp or 'CORPORACION TELEMIC' in isp:
                isp_name = 'INTER'
            elif 'VITEL' in isp or 'VI-TEL' in isp:
                isp_name = 'VITEL'
            else:
                isp_name = isp
            user_ip = data.get('query', user_ip)
    except Exception:
        isp_name = "RED LOCAL / SIN CONEXIÓN"

    return render_template('Principal/index.html', hora=hora, fecha=fecha, ip=user_ip, isp=isp_name)

# ── CERRAR SESIÓN ─────────────────────────────────────────────
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# ── INICIAR ───────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=1818)
