import asyncio
from httpx import AsyncClient
from main import app

async def test():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r1 = await ac.get("/api/districts")
        print("districts:", r1.status_code)
        r2 = await ac.get("/api/dashboard?district=ADILABAD")
        print("dashboard:", r2.status_code)
        r3 = await ac.get("/api/recommendations?district=ADILABAD")
        print("recommendations:", r3.status_code)

if __name__ == "__main__":
    asyncio.run(test())
