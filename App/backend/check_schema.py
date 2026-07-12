import asyncio
from sqlalchemy import text
from db import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'profile2' OR table_name = 'profile1'"))
        cols = [r[0] for r in res]
        print("profile columns:", cols)

if __name__ == "__main__":
    asyncio.run(check())
