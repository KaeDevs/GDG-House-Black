import asyncio
import traceback
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import engine, get_db
from logic.optimizer import build_recommendations

async def run():
    async for db in get_db():
        try:
            recs = await build_recommendations(db, district="ADILABAD")
            print(f"Success! Found {len(recs)} recs.")
            break
        except Exception as e:
            traceback.print_exc()
            break

if __name__ == "__main__":
    asyncio.run(run())
