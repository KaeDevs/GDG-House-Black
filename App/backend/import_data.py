import os
import glob
import time
import chardet
import pandas as pd
from sqlalchemy import text
from db import sync_engine

MAPPINGS = {
    "profile_data_1": "profile1",
    "profile_data_2": "profile2",
    "facility_data": "facility",
    "teacher_data": "teacher",
    "enrolment_data_1": "enrolment1",
    "enrolment_data_2": "enrolment2"
}

def get_table_name(file_path):
    lower_path = file_path.lower()
    for key, table in MAPPINGS.items():
        if key in lower_path:
            return table
    return None

def get_postgres_type(dtype):
    if pd.api.types.is_integer_dtype(dtype):
        return "BIGINT"
    elif pd.api.types.is_float_dtype(dtype):
        return "DOUBLE PRECISION"
    elif pd.api.types.is_bool_dtype(dtype):
        return "BOOLEAN"
    elif pd.api.types.is_datetime64_any_dtype(dtype):
        return "DATE"
    else:
        return "TEXT"

def find_csv_files(base_path):
    csv_files = []
    for root, _, files in os.walk(base_path):
        for file in files:
            if file.lower().endswith(".csv"):
                csv_files.append(os.path.join(root, file))
    return csv_files

def cleanup_tables(engine):
    print("Dropping existing tables...")
    drops = [
        "DROP TABLE IF EXISTS profile1 CASCADE;",
        "DROP TABLE IF EXISTS profile2 CASCADE;",
        "DROP TABLE IF EXISTS facility CASCADE;",
        "DROP TABLE IF EXISTS teacher CASCADE;",
        "DROP TABLE IF EXISTS enrolment1 CASCADE;",
        "DROP TABLE IF EXISTS enrolment2 CASCADE;",
        "DROP TABLE IF EXISTS t_100_enr1 CASCADE;",
        "DROP VIEW IF EXISTS school_complete CASCADE;"
    ]
    with engine.begin() as conn:
        for stmt in drops:
            conn.execute(text(stmt))
    print("Tables dropped successfully.")

def process_file(file_path, engine, table_name):
    print(f"\\nProcessing {file_path} into table '{table_name}'...")
    
    start_time = time.time()
    total_imported = 0
    
    # Detect encoding
    with open(file_path, 'rb') as f:
        raw_data = f.read(100000)
    result = chardet.detect(raw_data)
    encoding = result['encoding'] or 'utf-8'
    if encoding.lower() == 'ascii':
        encoding = 'latin-1'
    
    # Read first chunk to infer types and create table if it doesn't exist
    try:
        df_sample = pd.read_csv(file_path, nrows=1000, encoding=encoding, low_memory=False)
    except Exception as e:
        print(f"Error reading sample from {file_path}: {e}")
        return 0
        
    df_sample.columns = [c.lower() for c in df_sample.columns]
    
    create_stmt = f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
    columns = []
    for col, dtype in df_sample.dtypes.items():
        pg_type = get_postgres_type(dtype)
        if col in ["pseudocode", "udise_code", "udise"]:
            pg_type = "BIGINT"
        columns.append(f"    {col} {pg_type}")
    create_stmt += ",\n".join(columns) + "\n);"
    
    with engine.begin() as conn:
        conn.execute(text(create_stmt))
        
    try:
        # HACKATHON DEMO MODE: Limit to 5000 rows.
        df = pd.read_csv(file_path, encoding=encoding, low_memory=False, nrows=5000)
        df.columns = [c.lower() for c in df.columns]
        
        for col, dtype in df.dtypes.items():
            if pd.api.types.is_object_dtype(dtype):
                df[col] = df[col].astype(str).replace("nan", None)
                
        try:
            df.to_sql(table_name, engine, if_exists="append", index=False, method="multi", chunksize=1000)
            total_imported += len(df)
            print(f"Loaded {table_name}... {total_imported} rows", flush=True)
        except Exception as e:
            print(f"\nFailed to insert data: {e}", flush=True)
            
    except Exception as e:
        print(f"\nError reading data: {e}", flush=True)
        
    elapsed = time.time() - start_time
    print(f"\nFinished {file_path} in {elapsed:.2f}s")
    return total_imported

def create_view(engine):
    print("\\nCreating school_complete view...")
    tables = ["profile1", "profile2", "facility", "teacher", "enrolment1", "enrolment2"]
    
    with engine.begin() as conn:
        # Check if tables exist
        for t in tables:
            res = conn.execute(text(f"SELECT to_regclass('public.{t}')"))
            if not res.scalar():
                print(f"Table {t} does not exist, cannot create view.")
                return

        # Find join column from profile1
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'profile1';"))
        profile_cols = [row[0] for row in res]
        join_col = "pseudocode" if "pseudocode" in profile_cols else ("udise_code" if "udise_code" in profile_cols else None)
        
        if not join_col:
            print("Could not find a common identifier (pseudocode or udise_code) in profile1 to join tables.")
            return
            
        view_stmt = f"CREATE OR REPLACE VIEW school_complete AS\nSELECT t0.* "
        from_stmt = f"FROM profile1 t0\n"
        
        for idx, table in enumerate(tables[1:], start=1):
            res = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}';"))
            cols = [row[0] for row in res]
            if join_col in cols:
                for c in cols:
                    if c != join_col:
                        view_stmt += f", t{idx}.{c} AS {table}_{c} "
                from_stmt += f"LEFT JOIN {table} t{idx} ON t0.{join_col} = t{idx}.{join_col}\n"
                
        full_stmt = view_stmt + "\n" + from_stmt
        conn.execute(text("DROP VIEW IF EXISTS school_complete CASCADE;"))
        conn.execute(text(full_stmt))
        print("school_complete view created successfully.")

def verify_and_print(engine):
    print("\\n--- VERIFICATION ---")
    with engine.begin() as conn:
        res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
        tables = [row[0] for row in res]
        print(f"Tables in public schema: {', '.join(tables)}")
        
        for table in ["profile1", "profile2", "facility", "teacher", "enrolment1", "enrolment2"]:
            if table in tables:
                res = conn.execute(text(f"SELECT COUNT(*) FROM {table};"))
                count = res.scalar()
                print(f"Imported {table} : {count} rows")
            else:
                print(f"Imported {table} : 0 rows (TABLE MISSING)")
                
        if "school_complete" in tables:
            res = conn.execute(text("SELECT COUNT(*) FROM school_complete;"))
            print(f"school_complete view : {res.scalar()} rows")

if __name__ == "__main__":
    base_dir = r"D:\\UDISE"
    
    cleanup_tables(sync_engine)
    
    print(f"\\nScanning for CSV files in {base_dir}...")
    csv_files = find_csv_files(base_dir)
    print(f"Found {len(csv_files)} CSV files.")
    
    # Dictionary to keep track of total rows per logical table
    table_counts = {t: 0 for t in MAPPINGS.values()}
    
    for f in csv_files:
        table_name = get_table_name(f)
        if table_name:
            imported = process_file(f, sync_engine, table_name)
            table_counts[table_name] += imported
        else:
            print(f"Warning: Could not map {f} to a known table.")
            
    create_view(sync_engine)
    verify_and_print(sync_engine)
