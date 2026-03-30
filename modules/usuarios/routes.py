from flask import Blueprint, jsonify, request
from modules.usuarios.model import (
    listar_usuarios, obtener_usuario,
    crear_usuario, actualizar_usuario, eliminar_usuario,
    listar_perfiles, listar_gerencias, listar_divisiones, listar_estados,
    obtener_estadisticas_usuarios
)

usuarios_bp = Blueprint('usuarios', __name__)

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
        res = crear_usuario(datos)
        return jsonify(res)
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500

# ── ACTUALIZAR ────────────────────────────────────────────────
@usuarios_bp.route('/api/usuarios/<int:id>', methods=['PUT'])
def api_actualizar(id):
    try:
        datos = request.get_json()
        filas = actualizar_usuario(id, datos)
        return jsonify({'ok': True, 'filas': filas, 'mensaje': 'Usuario actualizado'}) if filas else jsonify({'ok': False, 'mensaje': 'No se realizaron cambios'})
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
@usuarios_bp.route('/api/perfiles', methods=['GET'])
def api_perfiles():
    return jsonify({'ok': True, 'data': listar_perfiles()})

@usuarios_bp.route('/api/gerencias', methods=['GET'])
def api_gerencias():
    return jsonify({'ok': True, 'data': listar_gerencias()})

@usuarios_bp.route('/api/divisiones', methods=['GET'])
def get_divisiones():
    id_gerencia = request.args.get('id_gerencia')
    return jsonify({"ok": True, "data": listar_divisiones(id_gerencia)})

@usuarios_bp.route('/api/estados', methods=['GET'])
def api_estados():
    return jsonify({'ok': True, 'data': listar_estados()})
