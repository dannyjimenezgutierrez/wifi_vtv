from flask import Blueprint, request, jsonify
from .model import listar_perfiles, obtener_perfil, crear_perfil, actualizar_perfil, eliminar_perfil, obtener_estadisticas_perfiles

perfiles_bp = Blueprint('perfiles', __name__)

@perfiles_bp.route('/api/perfiles', methods=['GET'])
def get_perfiles():
    try:
        data = listar_perfiles()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@perfiles_bp.route('/api/perfiles/<int:id>', methods=['GET'])
def get_perfil(id):
    try:
        data = obtener_perfil(id)
        if data:
            return jsonify({"ok": True, "data": data})
        return jsonify({"ok": False, "mensaje": "Perfil no encontrado"})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@perfiles_bp.route('/api/perfiles', methods=['POST'])
def post_perfil():
    try:
        datos = request.get_json()
        res = crear_perfil(datos)
        return jsonify(res)
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@perfiles_bp.route('/api/perfiles/<int:id>', methods=['PUT'])
def put_perfil(id):
    try:
        datos = request.get_json()
        filas = actualizar_perfil(id, datos)
        if filas > 0:
            return jsonify({"ok": True, "mensaje": "Perfil actualizado correctamente"})
        return jsonify({"ok": False, "mensaje": "No se pudo actualizar el perfil o es el perfil ROOT"})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@perfiles_bp.route('/api/perfiles/<int:id>', methods=['DELETE'])
def delete_perfil(id):
    try:
        filas = eliminar_perfil(id)
        if filas > 0:
            return jsonify({"ok": True, "mensaje": "Perfil eliminado correctamente"})
        return jsonify({"ok": False, "mensaje": "No se pudo eliminar el perfil o es el perfil ROOT"})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@perfiles_bp.route('/api/perfiles/stats', methods=['GET'])
def get_stats():
    try:
        data = obtener_estadisticas_perfiles()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})
