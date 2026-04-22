from database.crud import db_select, db_select_one, db_insert, db_update, db_delete

def listar_marcas():
    query = "SELECT id, nombre, sigla FROM sw_vtv_marcas ORDER BY id DESC"
    return db_select(query)

def obtener_marca(id):
    query = "SELECT id, nombre, sigla FROM sw_vtv_marcas WHERE id = ?"
    return db_select_one(query, (id,))

def crear_marca(datos):
    nombre = datos.get('nombre', '').strip()
    sigla = datos.get('sigla', '').strip()
    
    if not nombre or not sigla:
        return {"ok": False, "mensaje": "NOMBRE Y SIGLA SON REQUERIDOS"}
    
    query = "INSERT INTO sw_vtv_marcas (nombre, sigla) VALUES (?, ?)"
    try:
        id_nuevo = db_insert(query, (nombre, sigla))
        if id_nuevo:
            return {"ok": True, "mensaje": "MARCA CREADA EXITOSAMENTE", "id": id_nuevo}
        return {"ok": False, "mensaje": "ERROR AL INSERTAR EN LA BASE DE DATOS"}
    except Exception as e:
        if "UNIQUE" in str(e).upper() or "SIGLA" in str(e).upper():
            return {"ok": False, "mensaje": f"LA SIGLA '{sigla}' YA SE ENCUENTRA REGISTRADA"}
        return {"ok": False, "mensaje": str(e)}

def actualizar_marca(id, datos):
    nombre = datos.get('nombre', '').strip()
    sigla = datos.get('sigla', '').strip()
    
    if not nombre or not sigla:
        return {"ok": False, "mensaje": "NOMBRE Y SIGLA SON REQUERIDOS"}
    
    query = "UPDATE sw_vtv_marcas SET nombre = ?, sigla = ? WHERE id = ?"
    try:
        filas = db_update(query, (nombre, sigla, id))
        if filas > 0:
            return {"ok": True, "mensaje": "MARCA ACTUALIZADA CORRECTAMENTE"}
        return {"ok": False, "mensaje": "NO SE ENCONTRÓ LA MARCA O NO HUBO CAMBIOS"}
    except Exception as e:
        if "UNIQUE" in str(e).upper():
            return {"ok": False, "mensaje": f"LA SIGLA '{sigla}' YA ESTÁ EN USO POR OTRA MARCA"}
        return {"ok": False, "mensaje": str(e)}

def eliminar_marca(id):
    query = "DELETE FROM sw_vtv_marcas WHERE id = ?"
    return db_delete(query, (id,))

def obtener_estadisticas_marcas():
    # Total de marcas en la tabla
    total = db_select_one("SELECT COUNT(*) as total FROM sw_vtv_marcas")
    # Equipos activos (conteo de la tabla wifi como representativa de equipos)
    activos = db_select_one("SELECT COUNT(*) as total FROM sw_vtv_wifi WHERE id_estados = 1")
    
    return {
        "total": total['total'] if total else 0,
        "activos": activos['total'] if activos else 0
    }
