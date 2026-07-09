"""GET /api/schools — Returns school records for a given district with status classification."""

from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db
from logic.optimizer import load_schools, get_school_status, get_summary_stats

router = APIRouter()


@router.get("/schools")
async def get_schools(
    district: Optional[str] = Query(None, description="Filter by district name, e.g. Chennai"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns schools with a computed `status` field, optionally filtered by district.
    - zero_enrollment: no students, merge candidate
    - overloaded: 1 teacher, >40 students
    - healthy: normal

    Query params:
      ?district=Chennai   → only Chennai schools
      (omitted)           → all schools across all districts
    """
    schools = await load_schools(db, district=district)
    for school in schools:
        school["status"] = get_school_status(school)

    stats = get_summary_stats(schools)

    return {
        "schools": schools,
        "stats": stats,
        "count": len(schools),
        "district": district,
    }
