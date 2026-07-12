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

def get_master_pseudocodes(csv_files):
    for f in csv_files:
        if get_table_name(f) == "profile1":
            print(f"Reading {f} to generate master pseudocode list...")
            with open(f, 'rb') as fp:
                result = chardet.detect(fp.read(100000))
            encoding = result['encoding'] or 'utf-8'
            if encoding.lower() == 'ascii':
                encoding = 'latin-1'
                
            # Read pseudocode and district to sample across all districts
            df = pd.read_csv(f, encoding=encoding, usecols=lambda c: c.lower().strip() in ['pseudocode', 'district'], low_memory=False)
            df.columns = [c.lower().strip() for c in df.columns]
            
            # Sample 10 schools per district to keep DB size manageable while having all districts
            sampled = df.groupby('district').head(10)
            master = set(sampled['pseudocode'].dropna().astype(int).tolist())
            print(f"Master list generated with {len(master)} pseudocodes across {df['district'].nunique()} districts.")
            return master
    return set()

def process_file(file_path, engine, table_name, master_pseudocodes):
    print(f"\nProcessing {file_path} into table '{table_name}'...")
    start_time = time.time()
    
    with open(file_path, 'rb') as f:
        result = chardet.detect(f.read(100000))
    encoding = result['encoding'] or 'utf-8'
    if encoding.lower() == 'ascii':
        encoding = 'latin-1'
        
    try:
        first_chunk = True
        imported = 0
        for chunk in pd.read_csv(file_path, encoding=encoding, low_memory=False, chunksize=20000):
            chunk.columns = [c.lower().strip() for c in chunk.columns]
            
            if 'pseudocode' in chunk.columns:
                chunk = chunk[chunk["pseudocode"].isin(master_pseudocodes)]
                
            if chunk.empty:
                continue
                
            if first_chunk:
                create_stmt = f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
                columns = []
                for col, dtype in chunk.dtypes.items():
                    pg_type = get_postgres_type(dtype)
                    if col in ["pseudocode", "udise_code", "udise"]:
                        pg_type = "BIGINT"
                    columns.append(f"    {col} {pg_type}")
                create_stmt += ",\n".join(columns) + "\n);"
                
                with engine.begin() as conn:
                    conn.execute(text(create_stmt))
                first_chunk = False
                
            for col, dtype in chunk.dtypes.items():
                if pd.api.types.is_object_dtype(dtype):
                    chunk[col] = chunk[col].astype(str).replace("nan", None)
                    
            chunk.to_sql(table_name, engine, if_exists="append", index=False, method="multi")
            imported += len(chunk)
            print(f"Loaded {imported} rows so far into {table_name}...")
            
        elapsed = time.time() - start_time
        print(f"Finished {file_path} in {elapsed:.2f}s. Total: {imported} rows.")
        return imported
        
    except Exception as e:
        print(f"Failed to process file {file_path}: {e}")
        return 0

def create_view(engine):
    print("\nCreating school_complete view with aggregated CTEs...")
    
    # Generate SUM statements for enrolment tables
    e1_cols = []
    for i in range(1, 13):
        e1_cols.append(f"c{i}_b")
        e1_cols.append(f"c{i}_g")
    e1_cols = ["cpp_b", "cpp_g"] + e1_cols
    
    e1_sums = ",\n        ".join([f"SUM(COALESCE({c}, 0)) AS enrolment1_{c}" for c in e1_cols])
    e2_sums = ",\n        ".join([f"SUM(COALESCE({c}, 0)) AS enrolment2_{c}" for c in e1_cols])
    
    view_stmt = f"""CREATE OR REPLACE VIEW school_complete AS
WITH e1_agg AS (
    SELECT pseudocode,
        {e1_sums}
    FROM enrolment1
    GROUP BY pseudocode
),
e2_agg AS (
    SELECT pseudocode,
        {e2_sums}
    FROM enrolment2
    GROUP BY pseudocode
)
SELECT 
    t0.pseudocode"""
    
    def get_columns(table_name):
        with engine.connect() as conn:
            res = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'"))
            return [r[0] for r in res if r[0] != 'pseudocode']
            
    try:
        p1_cols = get_columns("profile1")
        p2_cols = get_columns("profile2")
        fac_cols = get_columns("facility")
        tch_cols = get_columns("teacher")
        
        for c in p1_cols:
            view_stmt += f",\n    t0.{c}"
        for c in p2_cols:
            view_stmt += f",\n    t1.{c} AS profile2_{c}"
        for c in fac_cols:
            view_stmt += f",\n    t2.{c} AS facility_{c}"
        for c in tch_cols:
            view_stmt += f",\n    t3.{c} AS teacher_{c}"
            
        for c in e1_cols:
            view_stmt += f",\n    e1.enrolment1_{c}"
        for c in e1_cols:
            view_stmt += f",\n    e2.enrolment2_{c}"
            
        view_stmt += f"""
FROM profile1 t0
LEFT JOIN profile2 t1 ON t0.pseudocode = t1.pseudocode
LEFT JOIN teacher t3 ON t0.pseudocode = t3.pseudocode
LEFT JOIN facility t2 ON t0.pseudocode = t2.pseudocode
LEFT JOIN e1_agg e1 ON t0.pseudocode = e1.pseudocode
LEFT JOIN e2_agg e2 ON t0.pseudocode = e2.pseudocode;
"""
        with engine.begin() as conn:
            conn.execute(text("DROP VIEW IF EXISTS school_complete CASCADE;"))
            conn.execute(text(view_stmt))
        print("school_complete view created successfully.")
    except Exception as e:
        print(f"Error creating view: {e}")

def verify_and_print(engine):
    print("\n--- VERIFICATION ---")
    with engine.begin() as conn:
        for table in ["profile1", "profile2", "facility", "teacher", "enrolment1", "enrolment2"]:
            try:
                res = conn.execute(text(f"SELECT COUNT(*) FROM {table};"))
                print(f"Imported {table} : {res.scalar()} rows")
                res = conn.execute(text(f"SELECT COUNT(DISTINCT pseudocode) FROM {table};"))
                print(f"Distinct pseudocodes in {table}: {res.scalar()}")
            except:
                pass
                
        try:
            res = conn.execute(text("SELECT COUNT(*) FROM school_complete;"))
            print(f"\nschool_complete view total rows : {res.scalar()} rows")
            
            res = conn.execute(text("SELECT COUNT(teacher_total_tch), COUNT(enrolment1_c1_b) FROM school_complete;"))
            counts = res.fetchone()
            print(f"Teacher count in view: {counts[0]}")
            print(f"Enrolment1 c1_b count in view: {counts[1]}")
        except:
            pass

def main():
    base_dir = r"D:\\UDISE"
    
    cleanup_tables(sync_engine)
    
    print(f"\nScanning for CSV files in {base_dir}...")
    csv_files = find_csv_files(base_dir)
    print(f"Found {len(csv_files)} CSV files.")
    
    master_pseudocodes = get_master_pseudocodes(csv_files)
    
    for f in csv_files:
        table_name = get_table_name(f)
        if table_name:
            process_file(f, sync_engine, table_name, master_pseudocodes)
        else:
            print(f"Warning: Could not map {f} to a known table.")
            
    create_view(sync_engine)
    verify_and_print(sync_engine)

if __name__ == "__main__":
    main()
