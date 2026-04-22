from database.crud import db_select, db_select_one, db_insert, db_update, db_delete

def listar_ubicaciones():
    query = "SELECT id, nombre FROM sw_vtv_ubicaciones ORDER BY id DESC"
    return db_select(query)

def obtener_ubicacion(id):
    query = "SELECT id, nombre FROM sw_vtv_ubicaciones WHERE id = ?"
    return db_select_one(query, (id,))

def crear_ubicacion(datos):
    nombre = datos.get('nombre', '').strip()
    
    if not nombre:
        return {"ok": False, "mensaje": "EL NOMBRE DE LA UBICACIÓN ES REQUERIDO"}
    
    query = "INSERT INTO sw_vtv_ubicaciones (nombre) VALUES (?)"
    try:
        id_nuevo = db_insert(query, (nombre,))
        if id_nuevo:
            return {"ok": True, "mensaje": "UBICACIÓN REGISTRADA EXITOSAMENTE", "id": id_nuevo}
        return {"ok": False, "mensaje": "ERROR AL INSERTAR EN LA BASE DE DATOS"}
    except Exception as e:
        return {"ok": False, "mensaje": str(e)}

def actualizar_ubicacion(id, datos):
    nombre = datos.get('nombre', '').strip()
    
    if not nombre:
        return {"ok": False, "mensaje": "EL NOMBRE ES REQUERIDO"}
    
    query = "UPDATE sw_vtv_ubicaciones SET nombre = ? WHERE id = ?"
    try:
        filas = db_update(query, (nombre, id))
        if filas > 0:
            return {"ok": True, "mensaje": "UBICACIÓN ACTUALIZADA CORRECTAMENTE"}
        return {"ok": False, "mensaje": "NO SE ENCONTRÓ EL REGISTRO O NO HUBO CAMBIOS"}
    except Exception as e:
        return {"ok": False, "mensaje": str(e)}

def eliminar_ubicacion(id):
    query = "DELETE FROM sw_vtv_ubicaciones WHERE id = ?"
    return db_delete(query, (id,))

def obtener_estadisticas_ubicaciones():
    # Total de ubicaciones
    total_res = db_select_one("SELECT COUNT(*) as total FROM sw_vtv_ubicaciones")
    
    # Total de pisos (filtrando por los que contienen Piso 1, 2, 3 o 4)
    # Usamos LIKE con OR para compatibilidad con SQL Server
    pisos_res = db_select_one("""
        SELECT COUNT(*) as total 
        FROM sw_vtv_ubicaciones 
        WHERE nombre LIKE '%Piso 1%' 
           OR nombre LIKE '%Piso 2%' 
           OR nombre LIKE '%Piso 3%' 
           OR nombre LIKE '%Piso 4%'
    """)
    
    return {
        "total_ubicaciones": total_res['total'] if total_res else 0,
        "total_pisos": pisos_res['total'] if pisos_res else 0
    }
