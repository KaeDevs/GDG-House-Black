import asyncio
from db import get_db, async_engine
from sqlalchemy import text

async def validate():
    print("\\n=====================================================")
    print("DATABASE VALIDATION")
    print("=====================================================")
    
    async with async_engine.connect() as conn:
        tables = ["profile1", "profile2", "teacher", "facility", "enrolment1", "enrolment2"]
        for table in tables:
            try:
                res = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                print(f"{table} total rows: {res.scalar()}")
            except Exception as e:
                print(f"Error checking {table}: {e}")
            
        print("\\n")
        for table in tables:
            try:
                res = await conn.execute(text(f"SELECT COUNT(DISTINCT pseudocode) FROM {table}"))
                print(f"{table} DISTINCT pseudocode: {res.scalar()}")
            except Exception as e:
                print(f"Error checking distinct {table}: {e}")

        print("\\n=====================================================")
        print("JOIN VALIDATION")
        print("=====================================================")
        join_tables = ["teacher", "facility", "enrolment1", "enrolment2"]
        for table in join_tables:
            try:
                query = f"SELECT COUNT(*) FROM profile1 p INNER JOIN {table} t ON p.pseudocode=t.pseudocode"
                res = await conn.execute(text(query))
                print(f"profile1 <-> {table} overlap: {res.scalar()}")
            except Exception as e:
                print(f"Error join {table}: {e}")
            
        print("\\n=====================================================")
        print("VIEW VALIDATION")
        print("=====================================================")
        try:
            res = await conn.execute(text("SELECT COUNT(*) FROM school_complete"))
            print(f"school_complete total rows: {res.scalar()}")
            
            query2 = "SELECT COUNT(teacher_total_tch), COUNT(enrolment1_c1_b), COUNT(facility_electricity_availability) FROM school_complete"
            res = await conn.execute(text(query2))
            counts = res.fetchone()
            print(f"teacher_total_tch NOT NULL: {counts[0]}")
            print(f"enrolment1_c1_b NOT NULL: {counts[1]}")
            print(f"facility_electricity_availability NOT NULL: {counts[2]}")
        except Exception as e:
            print(f"Error view validation: {e}")

if __name__ == "__main__":
    asyncio.run(validate())
