from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any

from db import get_db
from models import DashboardStats, SchoolResponse

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    try:
        # We assume the view 'school_complete' exists and has standard columns
        # To make this robust without knowing the exact schema, we will query standard counts
        
        # 1. Total Schools
        res = await db.execute(text("SELECT count(*) FROM school_complete;"))
        total_schools = res.scalar() or 0
        
        # We fallback to defaults if specific columns aren't found in the datasets
        return DashboardStats(
            total_schools=total_schools,
            total_students=0, # Need actual column name from enrolment to aggregate
            total_teachers=0, # Need actual column from teacher to aggregate
            state_wise_schools={},
            district_wise_schools={},
            infrastructure_summary={},
            teacher_summary={},
            enrollment_summary={},
            student_teacher_ratio=0.0,
            schools_without_electricity=0,
            schools_without_internet=0,
            schools_without_toilets=0,
            single_teacher_schools=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/schools")
async def get_schools(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)):
    res = await db.execute(text(f"SELECT * FROM school_complete LIMIT {limit} OFFSET {offset};"))
    return [dict(row._mapping) for row in res]

@router.get("/schools/{id}")
async def get_school(id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(text(f"SELECT * FROM school_complete WHERE pseudocode = {id} OR udise_code = {id};"))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="School not found")
    return dict(row._mapping)

@router.get("/state/{state}")
async def get_schools_by_state(state: str, limit: int = 100, db: AsyncSession = Depends(get_db)):
    res = await db.execute(text(f"SELECT * FROM school_complete WHERE state ILIKE '%{state}%' LIMIT {limit};"))
    return [dict(row._mapping) for row in res]

@router.get("/district/{district}")
async def get_schools_by_district(district: str, limit: int = 100, db: AsyncSession = Depends(get_db)):
    res = await db.execute(text(f"SELECT * FROM school_complete WHERE district ILIKE '%{district}%' LIMIT {limit};"))
    return [dict(row._mapping) for row in res]

@router.get("/block/{block}")
async def get_schools_by_block(block: str, limit: int = 100, db: AsyncSession = Depends(get_db)):
    res = await db.execute(text(f"SELECT * FROM school_complete WHERE block ILIKE '%{block}%' LIMIT {limit};"))
    return [dict(row._mapping) for row in res]

@router.get("/teachers")
async def get_teachers(limit: int = 100, db: AsyncSession = Depends(get_db)):
    res = await db.execute(text(f"SELECT * FROM teacher LIMIT {limit};"))
    return [dict(row._mapping) for row in res]

@router.get("/facilities")
async def get_facilities(limit: int = 100, db: AsyncSession = Depends(get_db)):
    res = await db.execute(text(f"SELECT * FROM facility LIMIT {limit};"))
    return [dict(row._mapping) for row in res]

@router.get("/enrolment")
async def get_enrolment(limit: int = 100, db: AsyncSession = Depends(get_db)):
    res = await db.execute(text(f"SELECT * FROM enrolment1 LIMIT {limit};"))
    return [dict(row._mapping) for row in res]

@router.get("/search")
async def search_schools(q: str = Query(...), limit: int = 50, db: AsyncSession = Depends(get_db)):
    # Simple search on name if we assume a 'school_name' column exists
    # Or search on state/district
    query = text(f"""
        SELECT * FROM school_complete 
        WHERE state ILIKE :q OR district ILIKE :q OR block ILIKE :q
        LIMIT :limit
    """)
    res = await db.execute(query, {"q": f"%{q}%", "limit": limit})
    return [dict(row._mapping) for row in res]

@router.get("/analytics")
async def get_analytics(db: AsyncSession = Depends(get_db)):
    # Placeholder for more complex analytics query
    return {"message": "Analytics endpoint available"}
