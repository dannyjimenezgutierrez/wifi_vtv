from database.crud import db_select, db_select_one, db_insert, db_update, db_delete

# ── LISTAR TODOS ──────────────────────────────────────────────
def listar_gerencias():
    return db_select("SELECT id, nombre, sigla FROM sw_vtv_gerencias ORDER BY id ASC")

# ── BUSCAR UNO ────────────────────────────────────────────────
def obtener_gerencia(id):
    return db_select_one("SELECT * FROM sw_vtv_gerencias WHERE id = ?", (id,))

# ── CREAR ─────────────────────────────────────────────────────
def crear_gerencia(datos):
    # Verificar si ya existe
    existe = db_select_one("SELECT id FROM sw_vtv_gerencias WHERE nombre = ? OR sigla = ?", (datos['nombre'], datos['sigla']))
    if existe:
        return {"ok": False, "mensaje": "Ya existe una GERENCIA con ese NOMBRE o SIGLA."}

    res = db_insert("""
        INSERT INTO sw_vtv_gerencias (nombre, sigla)
        VALUES (?, ?)
    """, (datos['nombre'], datos['sigla']))
    return {"ok": True, "id": res} if res else {"ok": False, "mensaje": "Error al insertar en la base de datos."}

# ── ACTUALIZAR ────────────────────────────────────────────────
def actualizar_gerencia(id, datos):
    if int(id) == 1:
        return {"ok": False, "mensaje": "La GERENCIA ROOT no puede ser modificada."}

    # Verificar si ya existe en OTRO registro
    existe = db_select_one("SELECT id FROM sw_vtv_gerencias WHERE (nombre = ? OR sigla = ?) AND id != ?", (datos['nombre'], datos['sigla'], id))
    if existe:
        return {"ok": False, "mensaje": "Ya existe otra GERENCIA con ese NOMBRE o SIGLA."}
    
    filas = db_update("""
        UPDATE sw_vtv_gerencias 
        SET nombre = ?, sigla = ?
        WHERE id = ?
    """, (datos['nombre'], datos['sigla'], id))
    return {"ok": True, "mensaje": "Gerencia actualizada."} if filas else {"ok": False, "mensaje": "No se realizaron cambios."}

# ── ELIMINAR ──────────────────────────────────────────────────
def eliminar_gerencia(id):
    if int(id) == 1:
        return 0
        
    return db_delete("DELETE FROM sw_vtv_gerencias WHERE id = ?", (id,))

# ── ESTADÍSTICAS ──────────────────────────────────────────────
def obtener_estadisticas_gerencias():
    return db_select_one("""
        SELECT 
            COUNT(*) as total,
            COUNT(*) as activos,
            0 as inactivos,
            SUM(CASE WHEN id = 1 THEN 1 ELSE 0 END) as seguros
        FROM sw_vtv_gerencias
    """)
