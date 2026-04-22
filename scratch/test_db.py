import sys
import os

# Add the project root to sys.path to allow importing database module
sys.path.append('/opt/wifi_vtv')

try:
    from database.connection import test_connection
    result = test_connection()
    print(result)
except Exception as e:
    print(f"Error executing test: {e}")
