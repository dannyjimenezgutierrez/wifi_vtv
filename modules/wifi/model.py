from PIL import Image
import qrcode
import os
from database.crud import db_select, db_select_one, db_insert, db_update, db_delete

def listar_wifi():
    query = """
        SELECT 
            w.id, w.ip, w.clave_admin, w.ssid, w.clave_paso, w.serial,
            g.nombre as gerencia, d.nombre as division, u.nombre as ubicacion,
            m.nombre as marca, e.nombre as estado, e.siglas as estado_siglas,
            w.qr_imagen, w.fecha_creacion,
            w.id_gerencias, w.id_divisiones, w.id_ubicaciones, w.id_marcas, w.id_estados
        FROM sw_vtv_wifi w
        LEFT JOIN sw_vtv_gerencias g ON w.id_gerencias = g.id
        LEFT JOIN sw_vtv_divisiones d ON w.id_divisiones = d.id
        LEFT JOIN sw_vtv_ubicaciones u ON w.id_ubicaciones = u.id
        LEFT JOIN sw_vtv_marcas m ON w.id_marcas = m.id
        LEFT JOIN sw_vtv_estados e ON w.id_estados = e.id
        ORDER BY w.id DESC
    """
    return db_select(query)

def obtener_wifi(id):
    query = "SELECT * FROM sw_vtv_wifi WHERE id = ?"
    return db_select_one(query, (id,))

def crear_wifi(datos):
    try:
        ip, ssid, serial = datos.get('ip'), datos.get('ssid'), datos.get('serial')
        
        # Validar duplicados de forma independiente para dar un mensaje preciso
        check_query = """
            SELECT 
                (SELECT TOP 1 1 FROM sw_vtv_wifi WHERE ip = ?) as ip_exists,
                (SELECT TOP 1 1 FROM sw_vtv_wifi WHERE ssid = ?) as ssid_exists,
                (SELECT TOP 1 1 FROM sw_vtv_wifi WHERE serial = ?) as serial_exists
        """
        checks = db_select_one(check_query, (ip, ssid, serial))
        
        if checks:
            if checks.get('ip_exists'): return {"ok": False, "mensaje": "LA DIRECCIÓN IP YA ESTÁ REGISTRADA EN OTRO EQUIPO."}
            if checks.get('ssid_exists'): return {"ok": False, "mensaje": "EL NOMBRE DE RED (SSID) YA ESTÁ REGISTRADO EN OTRO EQUIPO."}
            if checks.get('serial_exists'): return {"ok": False, "mensaje": "EL NÚMERO DE SERIAL YA ESTÁ REGISTRADO."}

        # Generar QR
        qr_path = generar_qr_wifi(ssid, datos.get('clave_paso'), serial)
        
        query = """
            INSERT INTO sw_vtv_wifi 
            (ip, clave_admin, ssid, clave_paso, serial, id_gerencias, id_divisiones, id_ubicaciones, id_marcas, id_estados, qr_imagen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            ip, datos.get('clave_admin'), ssid, 
            datos.get('clave_paso'), serial, datos.get('id_gerencias'),
            datos.get('id_divisiones'), datos.get('id_ubicaciones'), datos.get('id_marcas'),
            datos.get('id_estados'), qr_path
        )
        res = db_insert(query, params)
        return {"ok": True, "id": res} if res else {"ok": False, "mensaje": "Error al insertar equipo"}
    
    except Exception as e:
        err_msg = str(e).upper()
        print(f"[DATABASE ERROR] crear_wifi: {err_msg}")
        if 'UNIQUE' in err_msg or 'DUPLICADA' in err_msg or 'DUPLICADO' in err_msg:
            return {"ok": False, "mensaje": "ERROR: El IP, SSID o Serial ya existen en el sistema."}
        if 'REFERENCE' in err_msg or 'FOREIGN KEY' in err_msg:
            return {"ok": False, "mensaje": "ERROR DE INTEGRIDAD: Verifique que la Gerencia, División, Marca y Ubicación seleccionadas sean válidas."}
        return {"ok": False, "mensaje": f"ERROR DE BASE DE DATOS: {str(e)}"}

def actualizar_wifi(id, datos):
    try:
        ip, ssid, serial = datos.get('ip'), datos.get('ssid'), datos.get('serial')

        # Validar duplicados para otros registros
        check_query = """
            SELECT 
                (SELECT TOP 1 1 FROM sw_vtv_wifi WHERE ip = ? AND id != ?) as ip_exists,
                (SELECT TOP 1 1 FROM sw_vtv_wifi WHERE ssid = ? AND id != ?) as ssid_exists,
                (SELECT TOP 1 1 FROM sw_vtv_wifi WHERE serial = ? AND id != ?) as serial_exists
        """
        checks = db_select_one(check_query, (ip, id, ssid, id, serial, id))
        
        if checks:
            if checks.get('ip_exists'): return {"ok": False, "mensaje": "LA DIRECCIÓN IP YA ESTÁ ASIGNADA A OTRO EQUIPO."}
            if checks.get('ssid_exists'): return {"ok": False, "mensaje": "EL NOMBRE DE RED (SSID) YA ESTÁ EN USO POR OTRO EQUIPO."}
            if checks.get('serial_exists'): return {"ok": False, "mensaje": "EL NÚMERO DE SERIAL YA ESTÁ ASIGNADO A OTRO EQUIPO."}

        # Regenerar QR
        qr_path = generar_qr_wifi(ssid, datos.get('clave_paso'), serial)

        query = """
            UPDATE sw_vtv_wifi 
            SET ip=?, clave_admin=?, ssid=?, clave_paso=?, serial=?, 
                id_gerencias=?, id_divisiones=?, id_ubicaciones=?, id_marcas=?, id_estados=?,
                qr_imagen=?
            WHERE id=?
        """
        params = (
            ip, datos.get('clave_admin'), ssid, 
            datos.get('clave_paso'), serial, datos.get('id_gerencias'),
            datos.get('id_divisiones'), datos.get('id_ubicaciones'), datos.get('id_marcas'),
            datos.get('id_estados'), qr_path, id
        )
        filas = db_update(query, params)
        return {"ok": True} if filas else {"ok": False, "mensaje": "No se realizaron cambios o el registro no existe."}
    
    except Exception as e:
        err_msg = str(e).upper()
        print(f"[DATABASE ERROR] actualizar_wifi: {err_msg}")
        if 'UNIQUE' in err_msg or 'DUPLICADA' in err_msg or 'DUPLICADO' in err_msg:
            return {"ok": False, "mensaje": "ERROR: El IP, SSID o Serial ya existen en otro registro."}
        if 'REFERENCE' in err_msg or 'FOREIGN KEY' in err_msg:
            return {"ok": False, "mensaje": "ERROR DE INTEGRIDAD: Verifique que los catálogos seleccionados sean válidos."}
        return {"ok": False, "mensaje": f"ERROR DE BASE DE DATOS: {str(e)}"}

def eliminar_wifi(id):
    return db_delete("DELETE FROM sw_vtv_wifi WHERE id = ?", (id,))

def obtener_catalogos():
    return {
        "gerencias": db_select("SELECT id, nombre, sigla FROM sw_vtv_gerencias ORDER BY nombre"),
        "divisiones": db_select("SELECT id, nombre, id_gerencia FROM sw_vtv_divisiones ORDER BY nombre"),
        "ubicaciones": db_select("SELECT id, nombre FROM sw_vtv_ubicaciones ORDER BY nombre"),
        "marcas": db_select("SELECT id, nombre, sigla FROM sw_vtv_marcas ORDER BY nombre"),
        "estados": db_select("SELECT id, nombre, siglas FROM sw_vtv_estados ORDER BY id")
    }

def obtener_estadisticas_wifi():
    stats = db_select_one("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN id_estados = 1 THEN 1 ELSE 0 END) as activos,
            SUM(CASE WHEN id_estados = 2 THEN 1 ELSE 0 END) as inactivos
        FROM sw_vtv_wifi
    """)
    return stats if stats else {"total": 0, "activos": 0, "inactivos": 0}

def generar_qr_wifi(ssid, clave_paso, serial):
    try:
        qr_data = f"WIFI:S:{ssid};T:WPA;P:{clave_paso};;"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H, # Mayor corrección para permitir logo
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
        
        # Integrar logo institucional
        logo_path = "static/Principal/img/logo-VTV.png"
        if os.path.exists(logo_path):
            logo = Image.open(logo_path)
            
            # El logo debe ser pequeño para que el QR siga siendo legible (aprox 15-20%)
            qr_width, qr_height = img.size
            logo_max_size = int(qr_width * 0.22)
            logo.thumbnail((logo_max_size, logo_max_size), Image.LANCZOS)
            
            # Centrar
            logo_width, logo_height = logo.size
            pos = ((qr_width - logo_width) // 2, (qr_height - logo_height) // 2)
            
            # Pegar usando el canal alpha si existe
            mask = logo if logo.mode == 'RGBA' else None
            img.paste(logo, pos, mask=mask)
        
        base_path = "static/Principal/img/qr"
        filename = f"{serial.replace(' ', '_')}.png"
        file_path = os.path.join(base_path, filename)
        
        if not os.path.exists(base_path):
            os.makedirs(base_path)
            
        img.save(file_path)
        return f"/{file_path}"
    except Exception as e:
        print(f"Error generando QR corporativo: {e}")
        return None
