from flask import Blueprint, request, jsonify, session
from modules.auditoria.model import registrar_evento_wifi
from database.crud import db_select_one
from .model import (
    listar_wifi, obtener_wifi, crear_wifi, actualizar_wifi, 
    eliminar_wifi, obtener_catalogos, obtener_estadisticas_wifi
)

wifi_bp = Blueprint('wifi', __name__)

@wifi_bp.route('/api/wifi', methods=['GET'])
def get_wifi():
    try:
        data = listar_wifi()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@wifi_bp.route('/api/wifi/catalogos', methods=['GET'])
def get_catalogos():
    try:
        data = obtener_catalogos()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@wifi_bp.route('/api/wifi/stats', methods=['GET'])
def get_stats():
    try:
        data = obtener_estadisticas_wifi()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@wifi_bp.route('/api/wifi/<int:id>', methods=['GET'])
def get_equipo(id):
    try:
        data = obtener_wifi(id)
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@wifi_bp.route('/api/wifi', methods=['POST'])
def post_equipo():
    try:
        datos = request.get_json()
        res = crear_wifi(datos)
        if res.get('ok'):
            registrar_evento_wifi({
                "usuario": session.get('usuario', 'SYSTEM'),
                "ssid": datos.get('ssid'),
                "accion": "registro",
                "estado": "activo",
                "ip": request.remote_addr,
                "navegador": request.user_agent.string[:200]
            })
        return jsonify(res)
    except Exception as e:
        err_msg = str(e).upper()
        if 'UNIQUE' in err_msg or 'DUPLICADA' in err_msg or 'DUPLICADO' in err_msg:
            return jsonify({"ok": False, "mensaje": "ERROR: El equipo ya se encuentra registrado (SSID, IP o Serial duplicado)."})
        return jsonify({"ok": False, "mensaje": f"ERROR DE SISTEMA: {str(e)}"})

@wifi_bp.route('/api/wifi/<int:id>', methods=['PUT'])
def put_equipo(id):
    try:
        datos = request.get_json()
        res = actualizar_wifi(id, datos)
        if res.get('ok'):
            registrar_evento_wifi({
                "usuario": session.get('usuario', 'SYSTEM'),
                "ssid": datos.get('ssid'),
                "accion": "edicion",
                "estado": "activo",
                "ip": request.remote_addr,
                "navegador": request.user_agent.string[:200]
            })
        return jsonify(res)
    except Exception as e:
        err_msg = str(e).upper()
        if 'UNIQUE' in err_msg or 'DUPLICADA' in err_msg or 'DUPLICADO' in err_msg:
            return jsonify({"ok": False, "mensaje": "ERROR: Los nuevos datos ya pertenecen a otro equipo registrado."})
        return jsonify({"ok": False, "mensaje": f"ERROR DE SISTEMA: {str(e)}"})

@wifi_bp.route('/api/wifi/<int:id>', methods=['DELETE'])
def delete_equipo(id):
    try:
        # Optimización: Obtener solo el SSID necesario para la auditoría en lugar de todo el objeto
        equipo = db_select_one("SELECT ssid FROM sw_vtv_wifi WHERE id = ?", (id,))
        ssid = equipo.get('ssid') if equipo else 'ID:' + str(id)
        
        filas = eliminar_wifi(id)
        if filas:
            registrar_evento_wifi({
                "usuario": session.get('usuario', 'SYSTEM'),
                "ssid": ssid,
                "accion": "eliminacion",
                "estado": "activo",
                "ip": request.remote_addr,
                "navegador": request.user_agent.string[:200]
            })
        return jsonify({"ok": True}) if filas else jsonify({"ok": False, "mensaje": "No se eliminó el registro"})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})
