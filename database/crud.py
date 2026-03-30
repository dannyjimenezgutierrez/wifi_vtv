from database.connection import db_connection
import pyodbc

def db_select(query, params=()):
    try:
        with db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    except Exception as e:
        raise RuntimeError(f"Error SELECT: {e}")

def db_select_one(query, params=()):
    resultado = db_select(query, params)
    return resultado[0] if resultado else None

def db_insert(query, params=()):
    try:
        with db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            cursor.execute("SELECT @@IDENTITY AS id")
            row = cursor.fetchone()
            conn.commit()
            return int(row.id) if row and row.id else 0
    except Exception as e:
        raise RuntimeError(f"Error INSERT: {e}")

def db_update(query, params=()):
    try:
        with db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            filas = cursor.rowcount
            conn.commit()
            return filas
    except Exception as e:
        raise RuntimeError(f"Error UPDATE: {e}")

def db_delete(query, params=()):
    try:
        with db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            filas = cursor.rowcount
            conn.commit()
            return filas
    except Exception as e:
        raise RuntimeError(f"Error DELETE: {e}")
