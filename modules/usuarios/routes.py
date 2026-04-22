from flask import Blueprint, jsonify, request, session
import os
import base64
import uuid
from modules.usuarios.model import (
    listar_usuarios, obtener_usuario,
    crear_usuario, actualizar_usuario, eliminar_usuario,
    listar_divisiones, obtener_division, crear_division, actualizar_division, eliminar_division,
    listar_estados, obtener_estadisticas_usuarios, obtener_estadisticas_divisiones,
    cambiar_password
)

usuarios_bp = Blueprint('usuarios', __name__)

def guardar_foto_base64(base64_str, usuario):
    if not base64_str or not base64_str.startswith('data:image'):
        return base64_str
    
    try:
        header, encoded = base64_str.split(",", 1)
        ext = "png"
        if "jpeg" in header or "jpg" in header:
            ext = "jpg"
        
        filename = f"{usuario}_{uuid.uuid4().hex[:8]}.{ext}"
        save_dir = "/opt/wifi_vtv/static/Principal/img/perfiles"
        if not os.path.exists(save_dir):
            os.makedirs(save_dir, exist_ok=True)
            
        file_path = os.path.join(save_dir, filename)
        with open(file_path, "wb") as fh:
            fh.write(base64.b64decode(encoded))
            
        return f"/static/Principal/img/perfiles/{filename}"
    except Exception as e:
        print("Error saving image:", e)
        return ""

# ── LISTAR ────────────────────────────────────────────────────
@usuarios_bp.route('/api/usuarios', methods=['GET'])
def api_listar():
    try:
        datos = listar_usuarios()
        return jsonify({'ok': True, 'data': datos, 'total': len(datos)})
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

# ── ESTADISTICAS ──────────────────────────────────────────────
@usuarios_bp.route('/api/usuarios/stats', methods=['GET'])
def api_stats():
    try:
        stats = obtener_estadisticas_usuarios()
        return jsonify({'ok': True, 'data': stats})
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

# ── OBTENER UNO ───────────────────────────────────────────────
@usuarios_bp.route('/api/usuarios/<int:id>', methods=['GET'])
def api_obtener(id):
    try:
        dato = obtener_usuario(id)
        if dato:
            return jsonify({'ok': True, 'data': dato})
        return jsonify({'ok': False, 'mensaje': 'No encontrado'}), 404
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

# ── CREAR ─────────────────────────────────────────────────────
@usuarios_bp.route('/api/usuarios', methods=['POST'])
def api_crear():
    try:
        datos = request.get_json()
        if 'foto_perfil' in datos and isinstance(datos['foto_perfil'], str) and datos['foto_perfil'].startswith('data:image'):
            datos['foto_perfil'] = guardar_foto_base64(datos['foto_perfil'], datos.get('usuario', 'user'))

        res = crear_usuario(datos)
        return jsonify(res)
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

# ── ACTUALIZAR ────────────────────────────────────────────────
@usuarios_bp.route('/api/usuarios/<int:id>', methods=['PUT'])
def api_actualizar(id):
    try:
        datos = request.get_json()
        if 'foto_perfil' in datos and isinstance(datos['foto_perfil'], str) and datos['foto_perfil'].startswith('data:image'):
            datos['foto_perfil'] = guardar_foto_base64(datos['foto_perfil'], datos.get('usuario', 'user'))

        res = actualizar_usuario(id, datos)
        return jsonify(res)
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

# ── ELIMINAR ──────────────────────────────────────────────────
@usuarios_bp.route('/api/usuarios/<int:id>', methods=['DELETE'])
def api_eliminar(id):
    try:
        filas = eliminar_usuario(id)
        return jsonify({'ok': True, 'filas': filas, 'mensaje': 'Usuario eliminado'}) if filas else jsonify({'ok': False, 'mensaje': 'Error al eliminar o no encontrado'})
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500
# ── CATALOGOS ──────────────────────────────────────────────────
@usuarios_bp.route('/api/divisiones', methods=['GET'])
def get_divisiones():
    id_gerencia = request.args.get('id_gerencia')
    return jsonify({"ok": True, "data": listar_divisiones(id_gerencia)})

@usuarios_bp.route('/api/divisiones', methods=['POST'])
def post_division():
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    sigla = data.get('sigla', '').strip().upper()
    id_gerencia = data.get('id_gerencia')
    
    if not nombre or not sigla or not id_gerencia:
        return jsonify({'ok': False, 'mensaje': 'LLENE TODOS LOS CAMPOS.'}), 400
        
    try:
        res = crear_division(nombre, sigla, id_gerencia)
        return jsonify(res)
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

@usuarios_bp.route('/api/divisiones/<int:id>', methods=['GET'])
def get_division(id):
    try:
        div = obtener_division(id)
        if div:
            return jsonify({'ok': True, 'data': div})
        return jsonify({'ok': False, 'mensaje': 'DIVISIÓN NO ENCONTRADA.'}), 404
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

@usuarios_bp.route('/api/divisiones/<int:id>', methods=['PUT'])
def put_division(id):
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    sigla = data.get('sigla', '').strip().upper()
    id_gerencia = data.get('id_gerencia')
    
    if not nombre or not sigla or not id_gerencia:
        return jsonify({'ok': False, 'mensaje': 'LLENE TODOS LOS CAMPOS.'}), 400
        
    try:
        res = actualizar_division(id, nombre, sigla, id_gerencia)
        return jsonify(res)
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

@usuarios_bp.route('/api/divisiones/<int:id>', methods=['DELETE'])
def delete_division(id):
    try:
        eliminar_division(id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

@usuarios_bp.route('/api/divisiones/stats', methods=['GET'])
def api_divisiones_stats():
    try:
        stats = obtener_estadisticas_divisiones()
        return jsonify({'ok': True, 'data': stats})
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

@usuarios_bp.route('/api/estados', methods=['GET'])
def api_estados():
    return jsonify({'ok': True, 'data': listar_estados()})

@usuarios_bp.route('/api/usuarios/cambiar-clave', methods=['POST'])
def api_cambiar_clave():
    if 'id_usuario' not in session:
        return jsonify({'ok': False, 'mensaje': 'SESIÓN NO INICIADA.'}), 401
    
    try:
        datos = request.get_json()
        nueva_clave = datos.get('nueva_clave')
        if not nueva_clave:
            return jsonify({'ok': False, 'mensaje': 'DEBE INGRESAR LA NUEVA CLAVE.'}), 400
            
        res = cambiar_password(session['id_usuario'], nueva_clave)
        return jsonify(res)
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500
