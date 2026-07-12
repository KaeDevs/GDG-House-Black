import sys
from sqlalchemy import text
from db import sync_engine

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
            print("View 'school_complete' is missing!")
            return False
            
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
