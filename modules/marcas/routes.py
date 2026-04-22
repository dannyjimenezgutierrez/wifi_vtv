from flask import Blueprint, request, jsonify
from .model import listar_marcas, obtener_marca, crear_marca, actualizar_marca, eliminar_marca, obtener_estadisticas_marcas

marcas_bp = Blueprint('marcas', __name__)

@marcas_bp.route('/api/marcas/stats', methods=['GET'])
def get_marcas_stats():
    try:
        data = obtener_estadisticas_marcas()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@marcas_bp.route('/api/marcas', methods=['GET'])
def get_marcas():
    try:
        data = listar_marcas()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@marcas_bp.route('/api/marcas/<int:id>', methods=['GET'])
def get_marca(id):
    try:
        data = obtener_marca(id)
        if data:
            return jsonify({"ok": True, "data": data})
        return jsonify({"ok": False, "mensaje": "MARCA NO ENCONTRADA"})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@marcas_bp.route('/api/marcas', methods=['POST'])
def post_marca():
    try:
        datos = request.get_json()
        res = crear_marca(datos)
        return jsonify(res)
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@marcas_bp.route('/api/marcas/<int:id>', methods=['PUT'])
def put_marca(id):
    try:
        datos = request.get_json()
        res = actualizar_marca(id, datos)
        return jsonify(res)
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@marcas_bp.route('/api/marcas/<int:id>', methods=['DELETE'])
def delete_marca(id):
    try:
        filas = eliminar_marca(id)
        if filas > 0:
            return jsonify({"ok": True, "mensaje": "MARCA ELIMINADA CORRECTAMENTE"})
        return jsonify({"ok": False, "mensaje": "NO SE PUDO ELIMINAR LA MARCA"})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})
