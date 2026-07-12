import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(".env")
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
conn.autocommit = True
cur = conn.cursor()

print("Dropping view...")
cur.execute("DROP VIEW IF EXISTS school_complete CASCADE;")

print("Dropping table...")
cur.execute("DROP TABLE IF EXISTS profile1 CASCADE;")

print("Creating table...")
cur.execute("""
CREATE TABLE profile1 (
    pseudocode BIGINT PRIMARY KEY,
    district TEXT,
    state TEXT,
    lgd_vill_name TEXT,
    school_category TEXT,
    school_type TEXT,
    block TEXT,
    teacher_total_tch INT,
    teacher_male INT,
    teacher_female INT,
    teacher_transgender INT,
    facility_electricity_availability INT,
    facility_pack_water_yn INT,
    facility_pack_water_fun_yn INT,
    facility_total_boys_func_toilet INT,
    facility_total_girls_func_toilet INT,
    facility_boundary_wall INT,
    facility_library_availability INT
)
""")

for i in range(1, 13):
    cur.execute(f"ALTER TABLE profile1 ADD COLUMN enrolment1_c{i}_b INT DEFAULT 0")
    cur.execute(f"ALTER TABLE profile1 ADD COLUMN enrolment1_c{i}_g INT DEFAULT 0")
    cur.execute(f"ALTER TABLE profile1 ADD COLUMN enrolment2_c{i}_b INT DEFAULT 0")
    cur.execute(f"ALTER TABLE profile1 ADD COLUMN enrolment2_c{i}_g INT DEFAULT 0")

cur.execute("ALTER TABLE profile1 ADD COLUMN enrolment1_cpp_b INT DEFAULT 0")
cur.execute("ALTER TABLE profile1 ADD COLUMN enrolment1_cpp_g INT DEFAULT 0")
cur.execute("ALTER TABLE profile1 ADD COLUMN enrolment2_cpp_b INT DEFAULT 0")
cur.execute("ALTER TABLE profile1 ADD COLUMN enrolment2_cpp_g INT DEFAULT 0")

print("Inserting mock data...")
cur.execute("""
INSERT INTO profile1 (pseudocode, district, state, lgd_vill_name, school_category, school_type, block, teacher_total_tch, teacher_male, teacher_female, facility_electricity_availability)
VALUES 
(1, 'CHENNAI', 'TAMIL NADU', 'Village A', 'Primary', 'Government', 'Block A', 5, 2, 3, 1),
(2, 'CHENNAI', 'TAMIL NADU', 'Village B', 'Upper Primary', 'Private', 'Block B', 10, 5, 5, 1)
""")

print("Creating view...")
cur.execute("CREATE VIEW school_complete AS SELECT * FROM profile1;")

print("Mock DB created successfully")
