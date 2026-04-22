from database.crud import db_select, db_select_one, db_insert, db_update, db_delete

# ── LISTAR TODOS ──────────────────────────────────────────────
def listar_perfiles():
    return db_select("SELECT id, nombre, sigla FROM sw_vtv_perfiles ORDER BY id ASC")

# ── BUSCAR UNO ────────────────────────────────────────────────
def obtener_perfil(id):
    return db_select_one("SELECT * FROM sw_vtv_perfiles WHERE id = ?", (id,))

# ── CREAR ─────────────────────────────────────────────────────
def crear_perfil(datos):
    nombre = datos['nombre'].strip()
    
    # Verificar si el nombre ya existe
    existe = db_select_one("SELECT id FROM sw_vtv_perfiles WHERE UPPER(nombre) = UPPER(?)", (nombre,))
    if existe:
        return {"ok": False, "mensaje": f"EL PERFIL '{nombre.upper()}' YA EXISTE EN EL SISTEMA."}

    res = db_insert("""
        INSERT INTO sw_vtv_perfiles (nombre, sigla)
        VALUES (?, ?)
    """, (nombre, datos['sigla']))
    return {"ok": True, "id": res} if res else {"ok": False, "mensaje": "Error al insertar en la base de datos."}

# ── ACTUALIZAR ────────────────────────────────────────────────
def actualizar_perfil(id, datos):
    p = obtener_perfil(id)
    if not p:
        return 0
    
    # No permitir actualizar Root (ID 1) o PERFILES SEGURO
    if int(id) == 1 or p['nombre'].upper() == 'PERFILES SEGURO':
        return 0 
    
    nombre = datos['nombre'].strip()
    # Verificar si el nombre ya está siendo usado por otro ID
    existe = db_select_one("SELECT id FROM sw_vtv_perfiles WHERE UPPER(nombre) = UPPER(?) AND id != ?", (nombre, id))
    if existe:
        raise Exception(f"EL NOMBRE '{nombre.upper()}' YA ESTÁ SIENDO UTILIZADO POR OTRO PERFIL.")

    return db_update("""
        UPDATE sw_vtv_perfiles 
        SET nombre = ?, sigla = ?
        WHERE id = ?
    """, (nombre, datos['sigla'], id))

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
