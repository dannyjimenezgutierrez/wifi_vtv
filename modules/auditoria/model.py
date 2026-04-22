from database.crud import db_select, db_select_one, db_insert, db_update
from datetime import datetime

def listar_auditoria():
    query = """
        SELECT 
            id, usuario, modulo, ip, 
            CONVERT(VARCHAR, fecha, 103) as fecha,
            SUBSTRING(CONVERT(VARCHAR, hora_entrada, 108), 1, 8) as hora_entrada,
            SUBSTRING(CONVERT(VARCHAR, hora_salida, 108), 1, 8) as hora_salida,
            navegador
        FROM sw_vtv_auditoria_usuarios 
        ORDER BY id DESC
    """
    return db_select(query)

def registrar_evento(datos):
    # Validar que el módulo sea uno de los permitidos por el CHECK constraint de la tabla
    modulos_validos = [
        'auditoria/wifi', 'auditoria/usuarios', 'perifericos/wifi', 
        'perifericos/ubicacion', 'perifericos/marcas', 'configuracion/divisiones', 
        'configuracion/gerencias', 'configuracion/perfiles', 'configuracion/usuarios', 'principal'
    ]
    
    modulo = datos.get('modulo')
    if modulo not in modulos_validos:
        modulo = 'principal' # Valor por defecto si no coincide
        
    query = """
        INSERT INTO sw_vtv_auditoria_usuarios 
        (usuario, modulo, ip, fecha, hora_entrada, navegador)
        VALUES (?, ?, ?, CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME(0)), ?)
    """
    params = (
        datos.get('usuario'), 
        modulo, 
        datos.get('ip'), 
        datos.get('navegador')
    )
    return db_insert(query, params)

def registrar_salida_ultimo(usuario):
    """Actualiza la hora de salida del último registro abierto para este usuario"""
    query = """
        UPDATE sw_vtv_auditoria_usuarios 
        SET hora_salida = CAST(GETDATE() AS TIME(0)) 
        WHERE id = (
            SELECT TOP 1 id FROM sw_vtv_auditoria_usuarios 
            WHERE usuario = ? AND hora_salida IS NULL 
            ORDER BY id DESC
        )
    """
    return db_update(query, (usuario,))

def obtener_estadisticas_auditoria():
    try:
        # Eventos de hoy
        hoy = db_select_one("SELECT COUNT(*) as total FROM sw_vtv_auditoria_usuarios WHERE fecha = CAST(GETDATE() AS DATE)")
        # Usuarios únicos hoy
        users = db_select_one("SELECT COUNT(DISTINCT usuario) as total FROM sw_vtv_auditoria_usuarios WHERE fecha = CAST(GETDATE() AS DATE)")
        # Total histórico
        total = db_select_one("SELECT COUNT(*) as total FROM sw_vtv_auditoria_usuarios")
        
        return {
            "eventos_hoy": hoy.get('total', 0) if hoy else 0,
            "usuarios_activos": users.get('total', 0) if users else 0,
            "alertas": 0,
            "total_historico": total.get('total', 0) if total else 0
        }
    except Exception:
        return {"eventos_hoy": 0, "usuarios_activos": 0, "alertas": 0, "total_historico": 0}

def listar_auditoria_wifi():
    query = """
        SELECT 
            id, usuario, ssid, estado, accion, ip, 
            CONVERT(VARCHAR, fecha, 103) as fecha,
            SUBSTRING(CONVERT(VARCHAR, hora, 108), 1, 8) as hora,
            navegador
        FROM sw_vtv_auditoria_wifi 
        ORDER BY id DESC
    """
    return db_select(query)

def registrar_evento_wifi(datos):
    query = """
        INSERT INTO sw_vtv_auditoria_wifi 
        (usuario, ssid, accion, estado, ip, fecha, hora, navegador)
        VALUES (?, ?, ?, ?, ?, CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME(0)), ?)
    """
    params = (
        datos.get('usuario'), 
        datos.get('ssid'), 
        datos.get('accion'),
        datos.get('estado'),
        datos.get('ip'),
        datos.get('navegador')
    )
    return db_insert(query, params)

def obtener_estadisticas_auditoria_wifi():
    try:
        # Cambios hoy
        cambios = db_select_one("SELECT COUNT(*) as total FROM sw_vtv_auditoria_wifi WHERE fecha = CAST(GETDATE() AS DATE)")
        # APs únicos monitoreados hoy
        aps = db_select_one("SELECT COUNT(DISTINCT ssid) as total FROM sw_vtv_auditoria_wifi WHERE fecha = CAST(GETDATE() AS DATE)")
        # Alertas hoy (registros inactivos / fallidos)
        alertas = db_select_one("SELECT COUNT(*) as total FROM sw_vtv_auditoria_wifi WHERE fecha = CAST(GETDATE() AS DATE) AND estado = 'inactivo'")
        # Total histórico
        total = db_select_one("SELECT COUNT(*) as total FROM sw_vtv_auditoria_wifi")
        
        return {
            "cambios_hoy": cambios.get('total', 0) if cambios else 0,
            "aps_monitoreados": aps.get('total', 0) if aps else 0,
            "alertas": alertas.get('total', 0) if alertas else 0,
            "total_historico": total.get('total', 0) if total else 0
        }
    except Exception:
        return {"cambios_hoy": 0, "aps_monitoreados": 0, "alertas": 0, "total_historico": 0}
