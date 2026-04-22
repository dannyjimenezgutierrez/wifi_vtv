from database.crud import db_select
import json

try:
    # Try to get column information for the table
    # This works for SQL Server
    query = """
    SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'sw_vtv_wifi'
    """
    cols = db_select(query)
    
    # Try to get unique constraints
    query_constraints = """
    SELECT 
        C.CONSTRAINT_NAME, 
        K.COLUMN_NAME 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS C 
    JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS K 
        ON C.CONSTRAINT_NAME = K.CONSTRAINT_NAME 
    WHERE C.TABLE_NAME = 'sw_vtv_wifi' 
        AND C.CONSTRAINT_TYPE = 'UNIQUE'
    """
    constraints = db_select(query_constraints)

    print(json.dumps({"columns": cols, "constraints": constraints}, indent=2))
except Exception as e:
    print(f"Error: {e}")
