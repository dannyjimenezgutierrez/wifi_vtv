from flask import Blueprint, request, jsonify, session
from .model import (
    listar_auditoria, registrar_evento, registrar_salida_ultimo, 
    obtener_estadisticas_auditoria, listar_auditoria_wifi, 
    registrar_evento_wifi, obtener_estadisticas_auditoria_wifi
)

auditoria_bp = Blueprint('auditoria', __name__)

@auditoria_bp.route('/api/auditoria/usuarios', methods=['GET'])
def get_logs_usuarios():
    try:
        data = listar_auditoria()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@auditoria_bp.route('/api/auditoria/registrar', methods=['POST'])
def post_registrar_evento():
    try:
        if 'usuario' not in session:
            return jsonify({"ok": False, "mensaje": "Sesión no iniciada"})
            
        datos = request.get_json()
        usuario = session.get('usuario')
        
        # 1. Intentar cerrar el evento anterior
        registrar_salida_ultimo(usuario)
        
        # 2. Registrar el nuevo evento
        datos_evento = {
            "usuario": usuario,
            "modulo": datos.get('modulo'),
            "ip": request.remote_addr,
            "navegador": request.user_agent.string[:200]
        }
        registrar_evento(datos_evento)
        
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@auditoria_bp.route('/api/auditoria/stats', methods=['GET'])
def get_stats_auditoria():
    try:
        data = obtener_estadisticas_auditoria()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@auditoria_bp.route('/api/auditoria/wifi', methods=['GET'])
def get_logs_wifi():
    try:
        data = listar_auditoria_wifi()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})

@auditoria_bp.route('/api/auditoria/wifi/stats', methods=['GET'])
def get_stats_auditoria_wifi():
    try:
        data = obtener_estadisticas_auditoria_wifi()
        return jsonify({"ok": True, "data": data})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)})
