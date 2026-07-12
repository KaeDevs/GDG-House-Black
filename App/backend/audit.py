import asyncio
from db import get_db, async_engine
from sqlalchemy import text

async def audit():
    async with async_engine.connect() as conn:
        tables = ["profile1", "profile2", "teacher", "facility", "enrolment1", "enrolment2"]
        for table in tables:
            print(f"\\n--- Auditing {table} ---")
            try:
                res = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                print(f"Row count: {res.scalar()}")
                
                res = await conn.execute(text(f"SELECT COUNT(DISTINCT pseudocode) FROM {table}"))
                print(f"Unique pseudocodes: {res.scalar()}")
                
                res = await conn.execute(text(f"SELECT pseudocode, COUNT(*) FROM {table} GROUP BY pseudocode HAVING COUNT(*) > 1 LIMIT 1"))
                dup = res.fetchone()
                if dup:
                    print(f"Has duplicate pseudocodes! Example: {dup[0]} ({dup[1]} times)")
                else:
                    print(f"No duplicate pseudocodes.")
                    
            except Exception as e:
                print(f"Error auditing {table}: {e}")
                
        print("\\n--- Auditing school_complete ---")
        try:
            res = await conn.execute(text(f"SELECT COUNT(*) FROM school_complete"))
            print(f"Row count: {res.scalar()}")
            res = await conn.execute(text(f"SELECT COUNT(DISTINCT pseudocode) FROM school_complete"))
            print(f"Unique pseudocodes: {res.scalar()}")
        except Exception as e:
            print(f"Error auditing school_complete: {e}")

if __name__ == "__main__":
    asyncio.run(audit())
