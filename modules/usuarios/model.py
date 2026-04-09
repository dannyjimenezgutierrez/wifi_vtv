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
            u.foto_perfil,
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
    existe_cedula = db_select_one("SELECT id FROM sw_vtv_usuarios WHERE cedula = ?", (datos['cedula'],))
    if existe_cedula:
        return {"ok": False, "mensaje": "La CÉDULA ya se encuentra registrada en el sistema."}

    # Verificar si el usuario ya existe
    existe_usuario = db_select_one("SELECT id FROM sw_vtv_usuarios WHERE usuario = ?", (datos['usuario'],))
    if existe_usuario:
        return {"ok": False, "mensaje": "El NOMBRE DE USUARIO ya se encuentra registrado."}

    # Verificar si el correo ya existe (si se proporcionó)
    if datos.get('correo'):
        existe_correo = db_select_one("SELECT id FROM sw_vtv_usuarios WHERE correo = ?", (datos['correo'],))
        if existe_correo:
            return {"ok": False, "mensaje": "Este CORREO ELECTRÓNICO ya se encuentra registrado."}

    res = db_insert("""
        INSERT INTO sw_vtv_usuarios
            (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
             usuario, clave, telefono, cedula, correo, foto_perfil,
             id_perfil, id_estado, id_gerencia, id_division)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        datos.get('foto_perfil', ''),
        datos.get('id_perfil', 1),
        datos.get('id_estado', 1),
        datos.get('id_gerencia', 1),
        datos.get('id_division', 1),
    ))
    return {"ok": True, "id": res} if res else {"ok": False, "mensaje": "Error de base de datos."}

# ── ACTUALIZAR ────────────────────────────────────────────────
def actualizar_usuario(id, datos):
    # 1. Verificar si la cédula ya existe en OTRO usuario
    existe_cedula = db_select_one("SELECT id FROM sw_vtv_usuarios WHERE cedula = ? AND id != ?", (datos['cedula'], id))
    if existe_cedula:
        return {"ok": False, "mensaje": "La CÉDULA ya pertenece a otro usuario registrado."}

    # 2. Verificar si el nombre de usuario ya existe en OTRO usuario
    existe_usuario = db_select_one("SELECT id FROM sw_vtv_usuarios WHERE usuario = ? AND id != ?", (datos['usuario'], id))
    if existe_usuario:
        return {"ok": False, "mensaje": "El NOMBRE DE USUARIO ya pertenece a otro registro."}

    # 3. Verificar si el correo ya existe en OTRO usuario
    if datos.get('correo'):
        existe_correo = db_select_one("SELECT id FROM sw_vtv_usuarios WHERE correo = ? AND id != ?", (datos['correo'], id))
        if existe_correo:
            return {"ok": False, "mensaje": "El CORREO ELECTRÓNICO ya pertenece a otro usuario."}

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

    if 'clave' in datos and datos['clave']:
        query += ", clave = ?"
        params.append(datos['clave'])

    if 'foto_perfil' in datos:
        query += ", foto_perfil = ?"
        params.append(datos['foto_perfil'])

    query += " WHERE id = ?"
    params.append(id)

    filas = db_update(query, tuple(params))
    return {"ok": True, "filas": filas, "mensaje": "Usuario actualizado correctamente."} if filas else {"ok": False, "mensaje": "No se realizaron cambios o error en la base de datos."}

# ── ELIMINAR ──────────────────────────────────────────────────
def eliminar_usuario(id):
    return db_delete(
        "DELETE FROM sw_vtv_usuarios WHERE id = ?", (id,)
    )

# ── LISTAR CATALOGOS (PARA SELECTS) ───────────────────────────
def listar_divisiones(id_gerencia=None):
    query = """
        SELECT d.id, d.nombre, d.sigla, d.id_gerencia, g.nombre AS gerencia_nombre
        FROM sw_vtv_divisiones d
        LEFT JOIN sw_vtv_gerencias g ON g.id = d.id_gerencia
    """
    if id_gerencia:
        return db_select(query + " WHERE d.id_gerencia = ? ORDER BY d.id ASC", (id_gerencia,))
    return db_select(query + " ORDER BY d.id ASC")

def obtener_division(id):
    return db_select_one("""
        SELECT d.*, g.nombre as gerencia_nombre 
        FROM sw_vtv_divisiones d
        LEFT JOIN sw_vtv_gerencias g ON g.id = d.id_gerencia
        WHERE d.id = ?
    """, (id,))

def crear_division(nombre, sigla, id_gerencia):
    # Verificar si ya existe en esa gerencia
    existe = db_select_one("SELECT id FROM sw_vtv_divisiones WHERE nombre = ? AND id_gerencia = ?", (nombre, id_gerencia))
    if existe:
        return {"ok": False, "mensaje": "Ya existe una DIVISIÓN con ese nombre en la gerencia seleccionada."}

    res = db_insert(
        "INSERT INTO sw_vtv_divisiones (nombre, sigla, id_gerencia) VALUES (?, ?, ?)",
        (nombre, sigla, id_gerencia)
    )
    return {"ok": True, "id": res} if res else {"ok": False, "mensaje": "Error al insertar división."}

def actualizar_division(id, nombre, sigla, id_gerencia):
    # Verificar si ya existe en esa gerencia (en OTRO registro)
    existe = db_select_one("SELECT id FROM sw_vtv_divisiones WHERE nombre = ? AND id_gerencia = ? AND id != ?", (nombre, id_gerencia, id))
    if existe:
        return {"ok": False, "mensaje": "Ya existe otra DIVISIÓN con ese nombre en la gerencia seleccionada."}

    filas = db_update(
        "UPDATE sw_vtv_divisiones SET nombre = ?, sigla = ?, id_gerencia = ? WHERE id = ?",
        (nombre, sigla, id_gerencia, id)
    )
    return {"ok": True, "mensaje": "División actualizada."} if filas else {"ok": False, "mensaje": "No se realizaron cambios."}

def eliminar_division(id):
    return db_delete("DELETE FROM sw_vtv_divisiones WHERE id = ?", (id,))

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
