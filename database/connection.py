import pyodbc
from contextlib import contextmanager

# Habilitar connection pooling nativo de pyodbc (reutiliza conexiones existentes)
pyodbc.pooling = True

DB_CONFIG = {
    'server':   '127.0.0.1',
    'database': 'wifi_vtv',
    'username': 'danny',
    'password': 'Danny16029567*',    # ← cambia esto por tu clave de SQL Server
    'driver':   'ODBC Driver 18 for SQL Server',
}

def get_connection_string():
    return (
        f"DRIVER={{{DB_CONFIG['driver']}}};"
        f"SERVER={DB_CONFIG['server']};"
        f"DATABASE={DB_CONFIG['database']};"
        f"UID={DB_CONFIG['username']};"
        f"PWD={DB_CONFIG['password']};"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
        "Connection Timeout=5;"
    )

def get_connection():
    try:
        conn = pyodbc.connect(get_connection_string())
        return conn
    except pyodbc.Error as e:
        raise ConnectionError(f"Error al conectar con SQL Server: {e}")


@contextmanager
def db_connection():
    conn = None
    try:
        conn = get_connection()
        yield conn
    except pyodbc.Error as e:
        if conn:
            conn.rollback()
        raise RuntimeError(f"Error de base de datos: {e}")
    finally:
        if conn:
            conn.close()

def test_connection():
    try:
        with db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT @@VERSION AS version, @@SERVERNAME AS servidor")
            row = cursor.fetchone()
            return {
                'ok': True,
                'mensaje': 'Conexion exitosa',
                'servidor': row.servidor,
            }
    except Exception as e:
        return {
            'ok': False,
            'mensaje': str(e)
        }
