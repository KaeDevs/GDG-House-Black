import sys
from sqlalchemy import text
from db import sync_engine
from import_data import process_file, find_csv_files, get_table_name, create_view, MAPPINGS

EXPECTED_TABLES = [
    "profile1",
    "profile2",
    "facility",
    "teacher",
    "enrolment1",
    "enrolment2"
]

def verify_and_fix():
    print("Verifying database tables...")
    
    with sync_engine.begin() as conn:
        res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
        actual_tables = [row[0] for row in res]
        
    missing_tables = [t for t in EXPECTED_TABLES if t not in actual_tables]
    
    if missing_tables:
        print(f"Missing tables: {', '.join(missing_tables)}")
        print("Attempting to fix missing tables automatically...")
        
        base_dir = r"D:\\UDISE"
        csv_files = find_csv_files(base_dir)
        
        for f in csv_files:
            table_name = get_table_name(f)
            if table_name in missing_tables:
                print(f"Auto-importing missing dataset for {table_name}...")
                process_file(f, sync_engine, table_name)
                
        # Re-check after fixing
        with sync_engine.begin() as conn:
            res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
            actual_tables = [row[0] for row in res]
            
        still_missing = [t for t in EXPECTED_TABLES if t not in actual_tables]
        if still_missing:
            print(f"Failed to auto-fix missing tables: {', '.join(still_missing)}")
            return False

    all_data_present = True
    print("\\n--- Row Counts ---")
    
    with sync_engine.begin() as conn:
        for table in EXPECTED_TABLES:
            res = conn.execute(text(f"SELECT COUNT(*) FROM {table};"))
            count = res.scalar()
            if count == 0:
                print(f"ERROR: {table} contains 0 rows!")
                all_data_present = False
            else:
                print(f"✓ {table} : {count} rows")
                
        if not all_data_present:
            print("Verification failed due to empty tables.")
            return False
            
        print("\\nVerifying view 'school_complete'...")
        if "school_complete" not in actual_tables:
            print("View 'school_complete' is missing! Recreating it...")
            create_view(sync_engine)
            
        try:
            res = conn.execute(text("SELECT COUNT(*) FROM school_complete;"))
            count = res.scalar()
            print(f"✓ school_complete : {count} rows")
        except Exception as e:
            print(f"ERROR querying school_complete: {e}")
            return False
            
    print("\\nDatabase verification successful.")
    return True

if __name__ == "__main__":
    success = verify_and_fix()
    if not success:
        sys.exit(1)
