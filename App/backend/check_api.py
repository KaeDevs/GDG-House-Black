import asyncio
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("c:/Users/ELCOT/GDG-House-Black/App/backend/.env")
DB_URL = os.getenv("DATABASE_URL")

ENROLLMENT_COLS = [
    'enrolment1_cpp_b', 'enrolment1_cpp_g', 'enrolment1_c1_b', 'enrolment1_c1_g', 
    'enrolment1_c2_b', 'enrolment1_c2_g', 'enrolment1_c3_b', 'enrolment1_c3_g', 
    'enrolment1_c4_b', 'enrolment1_c4_g', 'enrolment1_c5_b', 'enrolment1_c5_g', 
    'enrolment1_c6_b', 'enrolment1_c6_g', 'enrolment1_c7_b', 'enrolment1_c7_g', 
    'enrolment1_c8_b', 'enrolment1_c8_g', 'enrolment1_c9_b', 'enrolment1_c9_g', 
    'enrolment1_c10_b', 'enrolment1_c10_g', 'enrolment1_c11_b', 'enrolment1_c11_g', 
    'enrolment1_c12_b', 'enrolment1_c12_g',
    'enrolment2_cpp_b', 'enrolment2_cpp_g', 'enrolment2_c1_b', 'enrolment2_c1_g', 
    'enrolment2_c2_b', 'enrolment2_c2_g', 'enrolment2_c3_b', 'enrolment2_c3_g', 
    'enrolment2_c4_b', 'enrolment2_c4_g', 'enrolment2_c5_b', 'enrolment2_c5_g', 
    'enrolment2_c6_b', 'enrolment2_c6_g', 'enrolment2_c7_b', 'enrolment2_c7_g', 
    'enrolment2_c8_b', 'enrolment2_c8_g', 'enrolment2_c9_b', 'enrolment2_c9_g', 
    'enrolment2_c10_b', 'enrolment2_c10_g', 'enrolment2_c11_b', 'enrolment2_c11_g', 
    'enrolment2_c12_b', 'enrolment2_c12_g'
]
ENROLLMENT_SQL = " + ".join([f"COALESCE({c}, 0)" for c in ENROLLMENT_COLS])
VALID_DATA_CONDITION = f"(COALESCE(teacher_total_tch, COALESCE(teacher_male,0) + COALESCE(teacher_female,0) + COALESCE(teacher_transgender,0), 0) > 0 OR ({ENROLLMENT_SQL}) > 0 OR COALESCE(facility_electricity_availability, 0) > 0 OR COALESCE(facility_total_boys_func_toilet, 0) > 0 OR COALESCE(facility_total_girls_func_toilet, 0) > 0 OR COALESCE(facility_pack_water_fun_yn, 0) > 0 OR COALESCE(facility_pack_water_yn, 0) > 0 OR COALESCE(facility_boundary_wall, 0) > 0 OR COALESCE(facility_library_availability, 0) > 0)"


def run():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        query = f"""
            SELECT DISTINCT district, state 
            FROM school_complete 
            WHERE district IS NOT NULL AND state IS NOT NULL AND {VALID_DATA_CONDITION}
            ORDER BY state, district
        """
        cur.execute(query)
        res = cur.fetchall()
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

run()
