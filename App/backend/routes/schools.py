from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from db import get_db
from logic.optimizer import format_school_row, get_summary_stats, ENROLLMENT_SQL, VALID_DATA_CONDITION

router = APIRouter()

@router.get("/schools")
async def get_schools(
    district: Optional[str] = Query(None, description="Filter by district name, e.g. Chennai"),
    limit: int = 2000,
    db: AsyncSession = Depends(get_db)
):
    query_str = f"""
        SELECT 
            pseudocode, district, lgd_vill_name, school_category, school_type, block,
            teacher_total_tch,
            ({ENROLLMENT_SQL}) as total_enrollment,
            latitude, longitude, lat, lon,
            facility_electricity_availability, facility_pack_water_yn, facility_pack_water_fun_yn,
            facility_total_boys_func_toilet, facility_total_girls_func_toilet, facility_boundary_wall, facility_library_availability
        FROM school_complete
        WHERE {VALID_DATA_CONDITION}
    """
    
    params = {}
    if district:
        query_str += " AND district ILIKE :district"
        params["district"] = f"%{district}%"
        
    query_str += f" LIMIT {limit}"
        
    res = await db.execute(text(query_str), params)
    schools = [format_school_row(dict(row._mapping)) for row in res]
    
    stats = get_summary_stats(schools)

    return {
        "schools": schools,
        "stats": stats,
        "count": len(schools),
        "district": district,
    }
