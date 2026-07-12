import asyncio
from db import get_db, async_engine
from sqlalchemy import text
from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

async def prove_db():
    print("\\n=========================================================")
    print("DATABASE QUERIES")
    print("=========================================================\\n")
    async with async_engine.connect() as conn:
        res = await conn.execute(text("SELECT COUNT(*) FROM profile1;"))
        print(f"SELECT COUNT(*) FROM profile1; -> {res.scalar()}")

        res = await conn.execute(text("SELECT COUNT(*) FROM teacher;"))
        print(f"SELECT COUNT(*) FROM teacher; -> {res.scalar()}")

        res = await conn.execute(text("SELECT COUNT(*) FROM enrolment1;"))
        print(f"SELECT COUNT(*) FROM enrolment1; -> {res.scalar()}")

        res = await conn.execute(text("SELECT COUNT(*) FROM facility;"))
        print(f"SELECT COUNT(*) FROM facility; -> {res.scalar()}")

        res = await conn.execute(text("SELECT COUNT(*) FROM school_complete;"))
        print(f"SELECT COUNT(*) FROM school_complete; -> {res.scalar()}")

        query = "SELECT COUNT(teacher_total_tch), COUNT(enrolment1_c1_b), COUNT(facility_electricity_availability) FROM school_complete;"
        res = await conn.execute(text(query))
        counts = res.fetchone()
        print(f"{query}\\n-> teacher_total_tch: {counts[0]}, enrolment1_c1_b: {counts[1]}, facility: {counts[2]}")

def prove_api():
    print("\\n=========================================================")
    print("API ENDPOINT RESPONSES (JSON)")
    print("=========================================================\\n")
    
    endpoints = [
        "/api/dashboard?district=CHENNAI",
        "/api/schools?district=CHENNAI&limit=2",
        "/api/search?q=public",
        "/api/analytics?district=CHENNAI",
        "/api/insights?district=CHENNAI"
    ]
    
    for ep in endpoints:
        print(f"GET {ep}")
        # TestClient handles async implicitly if setup correctly, but since get_db is async, TestClient works by running event loops.
        # Sometimes TestClient raises errors if not used in a specific way with SQLAlchemy Async sessions.
        # We will use it and see.
        response = client.get(ep)
        print(f"Status: {response.status_code}")
        try:
            data = response.json()
            json_str = json.dumps(data, indent=2)
            if len(json_str) > 1500:
                print(json_str[:1500] + "\\n... [truncated] ...")
            else:
                print(json_str)
        except Exception as e:
            print(f"Failed to parse JSON: {e}, text: {response.text[:200]}")
        print("\\n")

if __name__ == "__main__":
    asyncio.run(prove_db())
    prove_api()
