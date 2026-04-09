from database.crud import db_select, db_select_one, db_insert, db_update, db_delete

# ── LISTAR TODOS ──────────────────────────────────────────────
def listar_perfiles():
    return db_select("SELECT id, nombre, sigla FROM sw_vtv_perfiles ORDER BY id ASC")

# ── BUSCAR UNO ────────────────────────────────────────────────
def obtener_perfil(id):
    return db_select_one("SELECT * FROM sw_vtv_perfiles WHERE id = ?", (id,))

# ── CREAR ─────────────────────────────────────────────────────
def crear_perfil(datos):
    res = db_insert("""
        INSERT INTO sw_vtv_perfiles (nombre, sigla)
        VALUES (?, ?)
    """, (datos['nombre'], datos['sigla']))
    return {"ok": True, "id": res} if res else {"ok": False, "mensaje": "Error al insertar en la base de datos."}

# ── ACTUALIZAR ────────────────────────────────────────────────
def actualizar_perfil(id, datos):
    p = obtener_perfil(id)
    if not p:
        return 0
    
    # No permitir actualizar Root (ID 1) o PERFILES SEGURO
    if int(id) == 1 or p['nombre'].upper() == 'PERFILES SEGURO':
        return 0 
    
    return db_update("""
        UPDATE sw_vtv_perfiles 
        SET nombre = ?, sigla = ?
        WHERE id = ?
    """, (datos['nombre'], datos['sigla'], id))

# ── ELIMINAR ──────────────────────────────────────────────────
def eliminar_perfil(id):
    p = obtener_perfil(id)
    if not p:
        return 0

    # No permitir eliminar Root (ID 1) o PERFILES SEGURO
    if int(id) == 1 or p['nombre'].upper() == 'PERFILES SEGURO':
        return 0
        
    return db_delete("DELETE FROM sw_vtv_perfiles WHERE id = ?", (id,))

# ── ESTADÍSTICAS ──────────────────────────────────────────────
def obtener_estadisticas_perfiles():
    return db_select_one("""
        SELECT 
            COUNT(*) as total,
            COUNT(*) as activos,
            0 as inactivos,
            SUM(CASE WHEN id = 1 OR UPPER(nombre) = 'PERFILES SEGURO' THEN 1 ELSE 0 END) as seguros
        FROM sw_vtv_perfiles
    """)
