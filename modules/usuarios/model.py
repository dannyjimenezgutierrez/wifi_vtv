from database.crud import db_select, db_select_one, db_insert, db_update, db_delete

# ── LISTAR TODOS ──────────────────────────────────────────────
def listar_usuarios():
    return db_select("""
        SELECT
            u.id,
            u.primer_nombre,
            u.primer_apellido,
            u.usuario,
            u.cedula,
            u.telefono,
            u.correo,
            p.nombre   AS perfil,
            e.nombre   AS estado,
            g.nombre   AS gerencia,
            d.nombre   AS division
        FROM sw_vtv_usuarios u
        LEFT JOIN sw_vtv_perfiles   p ON p.id = u.id_perfil
        LEFT JOIN sw_vtv_estados    e ON e.id = u.id_estado
        LEFT JOIN sw_vtv_gerencias  g ON g.id = u.id_gerencia  
        LEFT JOIN sw_vtv_divisiones d ON d.id = u.id_division
        ORDER BY u.id DESC
    """)

# ── BUSCAR UNO ────────────────────────────────────────────────
def obtener_usuario(id):
    return db_select_one(
        "SELECT * FROM sw_vtv_usuarios WHERE id = ?", (id,)
    )

# ── CREAR ─────────────────────────────────────────────────────
def crear_usuario(datos):
    # Verificar si la cédula ya existe
    existe = db_select_one("SELECT id FROM sw_vtv_usuarios WHERE cedula = ?", (datos['cedula'],))
    if existe:
        return {"ok": False, "mensaje": "La CÉDULA ya se encuentra registrada en el sistema."}

    res = db_insert("""
        INSERT INTO sw_vtv_usuarios
            (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
             usuario, clave, telefono, cedula, correo,
             id_perfil, id_estado, id_gerencia, id_division)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datos['primer_nombre'],
        datos.get('segundo_nombre', ''),
        datos['primer_apellido'],
        datos.get('segundo_apellido', ''),
        datos['usuario'],
        datos['clave'],
        datos.get('telefono', ''),
        datos['cedula'],
        datos.get('correo', ''),
        datos.get('id_perfil', 1),
        datos.get('id_estado', 1),
        datos.get('id_gerencia', 1),
        datos.get('id_division', 1),
    ))
    return {"ok": True, "id": res} if res else {"ok": False, "mensaje": "Error de base de datos."}

# ── ACTUALIZAR ────────────────────────────────────────────────
def actualizar_usuario(id, datos):
    # Campos base que siempre se actualizan
    query = """
        UPDATE sw_vtv_usuarios SET
            primer_nombre    = ?, segundo_nombre   = ?,
            primer_apellido  = ?, segundo_apellido = ?,
            usuario          = ?, telefono         = ?,
            cedula           = ?, correo           = ?,
            id_perfil        = ?, id_estado        = ?,
            id_gerencia      = ?, id_division      = ?
    """
    params = [
        datos['primer_nombre'],    datos.get('segundo_nombre', ''),
        datos['primer_apellido'],   datos.get('segundo_apellido', ''),
        datos['usuario'],          datos.get('telefono', ''),
        datos['cedula'],           datos.get('correo', ''),
        datos.get('id_perfil', 1), datos.get('id_estado', 1),
        datos.get('id_gerencia', 1), datos.get('id_division', 1)
    ]

    # Si viene la clave, la agregamos a la actualización
    if 'clave' in datos and datos['clave']:
        query += ", clave = ?"
        params.append(datos['clave'])

    query += " WHERE id = ?"
    params.append(id)

    return db_update(query, tuple(params))

# ── ELIMINAR ──────────────────────────────────────────────────
def eliminar_usuario(id):
    return db_delete(
        "DELETE FROM sw_vtv_usuarios WHERE id = ?", (id,)
    )

# ── LISTAR CATALOGOS (PARA SELECTS) ───────────────────────────
def listar_perfiles():
    return db_select("SELECT id, nombre, sigla FROM sw_vtv_perfiles ORDER BY nombre ASC")

def listar_gerencias():
    return db_select("SELECT id, nombre FROM sw_vtv_gerencias ORDER BY nombre ASC")

def listar_divisiones(id_gerencia=None):
    if id_gerencia:
        return db_select("SELECT id, nombre FROM sw_vtv_divisiones WHERE id_gerencia = ? ORDER BY nombre ASC", (id_gerencia,))
    return db_select("SELECT id, nombre FROM sw_vtv_divisiones ORDER BY nombre ASC")

def listar_estados():
    return db_select("SELECT id, nombre FROM sw_vtv_estados ORDER BY nombre ASC")

def obtener_estadisticas_usuarios():
    return db_select_one("""
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN id_estado = 1 THEN 1 ELSE 0 END) AS activos,
            SUM(CASE WHEN id_estado = 2 THEN 1 ELSE 0 END) AS inactivos,
            SUM(CASE WHEN id_estado = 3 THEN 1 ELSE 0 END) AS bloqueados
        FROM sw_vtv_usuarios
    """)
