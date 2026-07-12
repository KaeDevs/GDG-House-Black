import sys
from db import sync_engine
from import_data import create_view

try:
    create_view(sync_engine)
    print("View created successfully.")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
