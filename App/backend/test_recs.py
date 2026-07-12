import asyncio
import json
from sqlalchemy import text
from db import AsyncSessionLocal
from logic.optimizer import build_recommendations

async def test_db():
    async with AsyncSessionLocal() as db:
        # test recommendations
        recs = await build_recommendations(db, "ADILABAD")
        print("RECOMMENDATIONS JSON:")
        print(json.dumps(recs[:2], indent=2))
        
if __name__ == "__main__":
    asyncio.run(test_db())
