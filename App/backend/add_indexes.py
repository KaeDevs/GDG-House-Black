import asyncio
from db import get_db, async_engine
from sqlalchemy import text

async def add_indexes():
    print("Creating indexes on school_complete view base tables...")
    async with async_engine.connect() as conn:
        # simpler indices
        indexes_simple = [
            "CREATE INDEX IF NOT EXISTS idx_profile1_district ON profile1 (district);",
            "CREATE INDEX IF NOT EXISTS idx_profile1_block ON profile1 (block);",
            "CREATE INDEX IF NOT EXISTS idx_profile1_pseudocode ON profile1 (pseudocode);",
            "CREATE INDEX IF NOT EXISTS idx_teacher_pseudocode ON teacher (pseudocode);",
            "CREATE INDEX IF NOT EXISTS idx_facility_pseudocode ON facility (pseudocode);",
            "CREATE INDEX IF NOT EXISTS idx_enrolment1_pseudocode ON enrolment1 (pseudocode);",
            "CREATE INDEX IF NOT EXISTS idx_enrolment2_pseudocode ON enrolment2 (pseudocode);",
        ]

        for idx in indexes_simple:
            try:
                await conn.execute(text(idx))
            except Exception as e:
                print(f"Index creation failed: {e}")
        await conn.commit()
        print("Indexes created.")

if __name__ == "__main__":
    asyncio.run(add_indexes())
