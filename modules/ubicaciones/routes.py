from flask import Blueprint, request, jsonify
from .model import listar_ubicaciones, obtener_ubicacion, crear_ubicacion, actualizar_ubicacion, eliminar_ubicacion, obtener_estadisticas_ubicaciones

ubicaciones_bp = Blueprint('ubicaciones', __name__)

@ubicaciones_bp.route('/api/ubicaciones', methods=['GET'])
def get_ubicaciones():
    try:
        data = listar_ubicaciones()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@ubicaciones_bp.route('/api/ubicaciones/stats', methods=['GET'])
def get_stats():
    try:
        data = obtener_estadisticas_ubicaciones()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@ubicaciones_bp.route('/api/ubicaciones/<int:id>', methods=['GET'])
def get_ubicacion(id):
    try:
        data = obtener_ubicacion(id)
        if data:
            return jsonify({"ok": True, "data": data})
        return jsonify({"ok": False, "mensaje": "UBICACIÓN NO ENCONTRADA"})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@ubicaciones_bp.route('/api/ubicaciones', methods=['POST'])
def post_ubicacion():
    try:
        datos = request.get_json()
        res = crear_ubicacion(datos)
        return jsonify(res)
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@ubicaciones_bp.route('/api/ubicaciones/<int:id>', methods=['PUT'])
def put_ubicacion(id):
    try:
        datos = request.get_json()
        res = actualizar_ubicacion(id, datos)
        return jsonify(res)
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@ubicaciones_bp.route('/api/ubicaciones/<int:id>', methods=['DELETE'])
def delete_ubicacion(id):
    try:
        filas = eliminar_ubicacion(id)
        if filas > 0:
            return jsonify({"ok": True, "mensaje": "UBICACIÓN ELIMINADA CORRECTAMENTE"})
        return jsonify({"ok": False, "mensaje": "NO SE PUDO ELIMINAR EL REGISTRO"})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})
