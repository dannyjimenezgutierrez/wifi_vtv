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
import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import subprocess
import os
import pty
import select
import signal
from flask_socketio import SocketIO, emit
from database.crud import db_select_one
from database.security import decrypt_password

app = Flask(__name__, static_folder=None)
app.secret_key = 'vtv_wifi_2026'

import os, mimetypes
from flask import abort, Response

@app.route('/static/<path:filename>')
def custom_static(filename):
    filepath = os.path.join(app.root_path, 'static', filename)
    if not os.path.exists(filepath):
        abort(404)
    with open(filepath, 'rb') as f:
        data = f.read()
    mimetype, _ = mimetypes.guess_type(filepath)
    return Response(data, mimetype=mimetype or 'application/octet-stream')

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# ── GESTIÓN DE PROCESOS DE TERMINAL ──────────────────────────
# Diccionario para rastrear los descriptores de archivos de los procesos PTY por sesión
terminal_fds = {}
terminal_pids = {}

def read_and_forward_pty(fd, room):
    """Tarea en segundo plano para leer del PTY y emitir al cliente"""
    while True:
        socketio.sleep(0.01)  # Pequeña pausa para no saturar el CPU
        if fd in terminal_fds.values():
            timeout = 0
            r, _, _ = select.select([fd], [], [], timeout)
            if r:
                try:
                    payload = os.read(fd, 1024).decode(errors='ignore')
                    if payload:
                        socketio.emit('terminal_output', {'data': payload}, room=room, namespace='/terminal')
                    else:
                        break
                except Exception:
                    break
        else:
            break

@socketio.on('connect', namespace='/terminal')
def on_connect_terminal():
    if 'usuario' not in session:
        return False  # Rechazar conexión si no hay sesión
    
    sid = request.sid
    (child_pid, fd) = pty.fork()

    if child_pid == 0:
        # Proceso hijo: ejecutar Bash
        try:
            os.environ['TERM'] = 'xterm-256color'
            os.environ['PATH'] = os.environ.get('PATH', '') + ':/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
            
            # Asegurar que el directorio de trabajo existe
            cwd = '/opt/wifi_vtv'
            if os.path.exists(cwd):
                os.chdir(cwd)
            
            # Intentar encontrar bash en rutas comunes
            bash_path = '/usr/bin/bash'
            if not os.path.exists(bash_path):
                bash_path = '/bin/bash'
            
            os.execv(bash_path, [bash_path])
        except Exception as e:
            # Salida de emergencia si falla el execv
            os._exit(1)
    else:
        # Proceso padre: registrar y empezar a monitorear
        terminal_fds[sid] = fd
        terminal_pids[sid] = child_pid
        socketio.start_background_task(target=read_and_forward_pty, fd=fd, room=sid)

@socketio.on('terminal_input', namespace='/terminal')
def on_terminal_input(data):
    sid = request.sid
    if sid in terminal_fds:
        os.write(terminal_fds[sid], data.get('input', '').encode())

@socketio.on('disconnect', namespace='/terminal')
def on_disconnect_terminal():
    sid = request.sid
    if sid in terminal_fds:
        try:
            os.kill(terminal_pids[sid], signal.SIGKILL)
            os.close(terminal_fds[sid])
        except Exception:
            pass
        del terminal_fds[sid]
        del terminal_pids[sid]

# ── BLUEPRINTS ────────────────────────────────────────────────
from modules.usuarios.routes import usuarios_bp
from modules.perfiles.routes import perfiles_bp
from modules.gerencias.routes import gerencias_bp
from modules.marcas.routes import marcas_bp
from modules.ubicaciones.routes import ubicaciones_bp
from modules.wifi.routes import wifi_bp
from modules.auditoria.routes import auditoria_bp
app.register_blueprint(usuarios_bp)
app.register_blueprint(perfiles_bp)
app.register_blueprint(gerencias_bp)
app.register_blueprint(marcas_bp)
app.register_blueprint(ubicaciones_bp)
app.register_blueprint(wifi_bp)
app.register_blueprint(auditoria_bp)
# ── LOGIN ──────────────────────────────────────────────────────
@app.route('/')
def login():
    if 'usuario' in session:
        return redirect(url_for('principal'))
    return render_template('Login/index.html')

# ── VALIDAR LOGIN DESDE JAVASCRIPT ────────────────────────────
# ── TERMINAL NATIVO ──────────────────────────────────────────
@app.route('/api/terminal/native')
def open_native_terminal():
    ip = request.args.get('ip')
    username = request.args.get('user', 'root')
    
    if os.name != 'posix':
        return jsonify({"status": "error", "message": "TERMINAL NATIVO SOLO DISPONIBLE EN LINUX."}), 400
    try:
        # Si hay IP, preparamos el comando SSH
        ssh_cmd = f"ssh {username}@{ip}" if ip else None
        
        # Intentar con terminator como prioridad, luego otros comunes
        for term in ['terminator', 'gnome-terminal', 'xterm', 'konsole']:
            try:
                if ssh_cmd:
                    # Diferentes terminales requieren diferentes flags para ejecutar comandos
                    if term == 'terminator':
                        subprocess.Popen([term, '-x', ssh_cmd])
                    elif term == 'gnome-terminal':
                        subprocess.Popen([term, '--', 'bash', '-c', f"{ssh_cmd}; exec bash"])
                    else:
                        subprocess.Popen([term, '-e', ssh_cmd])
                else:
                    subprocess.Popen([term])
                
                msg = f"TERMINAL {term.upper()} INICIADA" + (f" CON SSH A {ip}" if ip else "")
                return jsonify({"status": "success", "message": msg})
            except (FileNotFoundError, Exception):
                continue
        return jsonify({"status": "error", "message": "NO SE ENCONTRÓ UN EMULADOR DE TERMINAL COMPATIBLE."}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/entrar', methods=['GET', 'POST'])
def entrar():
    datos = request.get_json()
    usuario = datos.get('usuario', '').strip()
    password = datos.get('password', '')

    # Buscar usuario en la base de datos con su perfil
    user = db_select_one("""
        SELECT u.*, p.nombre as perfil_nombre 
        FROM sw_vtv_usuarios u 
        LEFT JOIN sw_vtv_perfiles p ON p.id = u.id_perfil 
        WHERE u.usuario = ?
    """, (usuario,))

    if not user:
        return jsonify({'ok': False, 'mensaje': 'EL USUARIO NO SE ENCUENTRA REGISTRADO EN EL SISTEMA.'})

    # Descifrar la clave almacenada para comparar
    clave_almacenada = decrypt_password(user['clave'])

    if clave_almacenada != password:
        return jsonify({'ok': False, 'mensaje': 'LA CONTRASEÑA ES INCORRECTA.'})

    if user.get('id_estado') != 1:
        return jsonify({'ok': False, 'mensaje': 'EL USUARIO SE ENCUENTRA BLOQUEADO O INACTIVO. CONTACTE AL ADMINISTRADOR.'})

    # Login exitoso — guardar datos en sesión
    session['usuario']          = usuario
    session['nombre']           = user.get('primer_nombre', '')
    session['apellido']         = user.get('primer_apellido', '')
    session['correo']           = user.get('correo', '')
    session['perfil_nombre']    = user.get('perfil_nombre', 'SIN PERFIL')
    session['id_perfil']        = user.get('id_perfil', 0)
    session['id_usuario']       = user.get('id', 0)
    session['foto_perfil']      = user.get('foto_perfil', '')
    return jsonify({'ok': True, 'redirigir': '/principal'})

import requests
from datetime import datetime

# ── PRINCIPAL ─────────────────────────────────────────────────
@app.route('/principal')
def principal():
    if 'usuario' not in session:
        return redirect(url_for('login', error='unauthorized'))
        
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
    socketio.run(app, debug=True, host='0.0.0.0', port=1818)



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
