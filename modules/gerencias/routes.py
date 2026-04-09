from flask import Blueprint, request, jsonify
from .model import listar_gerencias, obtener_gerencia, crear_gerencia, actualizar_gerencia, eliminar_gerencia, obtener_estadisticas_gerencias

gerencias_bp = Blueprint('gerencias', __name__)

@gerencias_bp.route('/api/gerencias', methods=['GET'])
def get_gerencias():
    try:
        data = listar_gerencias()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@gerencias_bp.route('/api/gerencias/<int:id>', methods=['GET'])
def get_gerencia(id):
    try:
        data = obtener_gerencia(id)
        if data:
            return jsonify({"ok": True, "data": data})
        return jsonify({"ok": False, "mensaje": "Gerencia no encontrada"})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@gerencias_bp.route('/api/gerencias', methods=['POST'])
def post_gerencia():
    try:
        datos = request.get_json()
        res = crear_gerencia(datos)
        return jsonify(res)
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@gerencias_bp.route('/api/gerencias/<int:id>', methods=['PUT'])
def put_gerencia(id):
    try:
        datos = request.get_json()
        res = actualizar_gerencia(id, datos)
        return jsonify(res)
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@gerencias_bp.route('/api/gerencias/<int:id>', methods=['DELETE'])
def delete_gerencia(id):
    try:
        filas = eliminar_gerencia(id)
        if filas > 0:
            return jsonify({"ok": True, "mensaje": "Gerencia eliminada correctamente"})
        return jsonify({"ok": False, "mensaje": "No se pudo eliminar la gerencia"})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@gerencias_bp.route('/api/gerencias/stats', methods=['GET'])
def get_stats():
    try:
        data = obtener_estadisticas_gerencias()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})
