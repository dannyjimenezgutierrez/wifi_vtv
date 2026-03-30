#------------------------------------------------------------------------------------------------------------|
#                                             WIFI  VTV                                                      |
#------------------------------------------------------------------------------------------------------------|
# NOMBRE         :  DANNY JOSÉ JIMÉNEZ GUTIERREZ                                                             |
# CÉDULA         :  16.029.567                                                                               |
# TELÉFONO       :  0424-281-44-55                                                                           |
# CORREO         :  dennaly88@gmail.com , djjimenez@vtv.gov.ve                                               |
# TÍTULO         :  INGENIERO EN SISTEMAS                                                                    |
#------------------------------------------------------------------------------------------------------------|
# SISTEMA        :  WIFI VTV                                                                                 |
# TECNOLOGÍAS    :  Python 3.10  , Flask 3.1.3, Microsoft SQL Server 2022 , JavaScript ES6 , Bootstrap 5     |
# GERENCIA       :  TECNOLOGÍA                                                                               |
# DIVISIÓN       :  DESARROLLO DE SISTEMAS                                                                   |
# FECHA          :  MIRANDA, MUNICIPIO SUCRE • FEBRERO 2026                                                  |
# VERSIÓN        :  2.1.0                                                                                    |
# EMPRESA        :  VENEZOLANA DE TELEVISIÓN - CANAL 8 - VTV - ASÍ SOMOS                                     |
# SISTEMA        :  Procesando                                                                               |
#------------------------------------------------------------------------------------------------------------|
#------------------------------------------------------------------------------------------------------------/

from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = 'vtv_wifi_2026'
# ── BLUEPRINTS ────────────────────────────────────────────────
from modules.usuarios.routes import usuarios_bp
app.register_blueprint(usuarios_bp)
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



#------------------------------------------------------------------------------------------------------------|
#------------------------------------------------------------------------------------------------------------|
#                        AUTOR DEL SISTEMA                                                                   |
#------------------------------------------------------------------------------------------------------------|
#                                                                                                            |
# NOMBRE         :  DANNY JOSE JIMENEZ GUTIERREZ                                                             |
# CEDULA         :  16.029.567                                                                               |
# TELEFONO       :  0424-281-44-55                                                                           |
# CORREO         :  DENNALY88@GMAIL.COM ,DJJIMENEZ@VTV.GOV.VE                                                |
# TITULO         :  INGENIERO EN SISTEMA                                                                     |
#------------------------------------------------------------------------------------------------------------|
# SISTEMA        :   WIFI VTV                                                                                |
# REALIZADO      :   Python 3.10  , Flask 3.1.3, Microsoft SQL Server 2022                                   |          
# GERENCIA DE    :   TECNOLOGIA                                                                              |
# DIVISION DE    :   DESARROLLO DE SISTEMAS                                                                  |
# FECHA          :   MIRANDA , MUNICIPIO SUCRE   2026                                                        |                               
#------------------------------------------------------------------------------------------------------------|
#------------------------------------------------------------------------------------------------------------->
