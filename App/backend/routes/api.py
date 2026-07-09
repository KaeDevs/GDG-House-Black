from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from db import get_db
from logic.optimizer import ENROLLMENT_SQL, VALID_DATA_CONDITION, format_school_row

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard(
    district: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Computes dashboard metrics purely via SQL aggregations.
    """
    where_clause = f"WHERE {VALID_DATA_CONDITION}"
    params = {}
    if district:
        where_clause += " AND district ILIKE :district"
        params["district"] = f"%{district}%"
        
    query = f"""
        SELECT 
            COUNT(*) as total_schools,
            SUM(CASE WHEN ({ENROLLMENT_SQL}) = 0 THEN 1 ELSE 0 END) as zero_enrollment,
            SUM(CASE WHEN teacher_total_tch = 1 THEN 1 ELSE 0 END) as single_teacher,
            SUM(
                CASE WHEN ({ENROLLMENT_SQL}) = 0 THEN 0
                     WHEN teacher_total_tch = 1 AND ({ENROLLMENT_SQL}) > 40 THEN ({ENROLLMENT_SQL})
                     WHEN teacher_total_tch = 0 THEN ({ENROLLMENT_SQL})
                     ELSE 0 
                END
            ) as students_affected
        FROM school_complete
        {where_clause}
    """
    res = await db.execute(text(query), params)
    row = res.first()
    
    return {
        "total_schools": int(row[0] or 0),
        "zero_enrollment_schools": int(row[1] or 0),
        "single_teacher_schools": int(row[2] or 0),
        "students_affected": int(row[3] or 0),
    }


@router.get("/analytics")
async def get_analytics(
    district: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns SQL aggregated analytics for enrollment distribution and district comparison.
    """
    # 1. Enrollment Buckets for the selected district
    where_clause = f"WHERE {VALID_DATA_CONDITION}"
    params = {}
    if district:
        where_clause += " AND district ILIKE :district"
        params["district"] = f"%{district}%"
        
    bucket_query = f"""
        WITH enrollments AS (
            SELECT ({ENROLLMENT_SQL}) as e FROM school_complete {where_clause}
        )
        SELECT 
            SUM(CASE WHEN e = 0 THEN 1 ELSE 0 END) as b_0,
            SUM(CASE WHEN e > 0 AND e <= 20 THEN 1 ELSE 0 END) as b_1_20,
            SUM(CASE WHEN e > 20 AND e <= 50 THEN 1 ELSE 0 END) as b_21_50,
            SUM(CASE WHEN e > 50 AND e <= 100 THEN 1 ELSE 0 END) as b_51_100,
            SUM(CASE WHEN e > 100 AND e <= 300 THEN 1 ELSE 0 END) as b_101_300,
            SUM(CASE WHEN e > 300 THEN 1 ELSE 0 END) as b_301_plus
        FROM enrollments
    """
    res_b = await db.execute(text(bucket_query), params)
    r = res_b.first()
    enrollment_data = [
        {"name": "0", "count": int(r[0] or 0)},
        {"name": "1-20", "count": int(r[1] or 0)},
        {"name": "21-50", "count": int(r[2] or 0)},
        {"name": "51-100", "count": int(r[3] or 0)},
        {"name": "101-300", "count": int(r[4] or 0)},
        {"name": "301+", "count": int(r[5] or 0)},
    ]
    
    # 2. District Comparison (All Districts)
    comp_query = f"""
        SELECT 
            district,
            SUM(CASE WHEN ({ENROLLMENT_SQL}) = 0 THEN 1 ELSE 0 END) as zero_enrollment,
            SUM(CASE WHEN teacher_total_tch = 1 AND ({ENROLLMENT_SQL}) > 0 THEN 1 ELSE 0 END) as single_teacher
        FROM school_complete
        WHERE district IS NOT NULL AND {VALID_DATA_CONDITION}
        GROUP BY district
        ORDER BY district
    """
    res_c = await db.execute(text(comp_query))
    comparison_data = []
    for row in res_c:
        comparison_data.append({
            "district": row[0],
            "zeroEnrollment": int(row[1] or 0),
            "singleTeacher": int(row[2] or 0)
        })
        
    return {
        "enrollment_data": enrollment_data,
        "comparison_data": comparison_data
    }


@router.get("/search")
async def search_schools(q: str = Query(...), limit: int = 50, db: AsyncSession = Depends(get_db)):
    """
    Server-side search supporting partial matching across multiple fields.
    """
    query = text(f"""
        SELECT 
            pseudocode, district, lgd_vill_name, school_category, school_type, block,
            teacher_total_tch,
            ({ENROLLMENT_SQL}) as total_enrollment,
            latitude, longitude, lat, lon,
            facility_electricity_availability, facility_pack_water_yn, facility_pack_water_fun_yn,
            facility_total_boys_func_toilet, facility_total_girls_func_toilet, facility_boundary_wall, facility_library_availability
        FROM school_complete 
        WHERE {VALID_DATA_CONDITION} AND (
            lgd_vill_name ILIKE :q 
            OR district ILIKE :q 
            OR block ILIKE :q 
            OR pseudocode::text ILIKE :q
            OR udise_code::text ILIKE :q
            OR school_category ILIKE :q
        )
        LIMIT :limit
    """)
    res = await db.execute(query, {"q": f"%{q}%", "limit": limit})
    return [format_school_row(dict(row._mapping)) for row in res]


@router.get("/insights")
async def get_insights(
    district: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates AI insight summaries from database statistics.
    """
    where_clause = f"WHERE {VALID_DATA_CONDITION}"
    params = {}
    if district:
        where_clause += " AND district ILIKE :district"
        params["district"] = f"%{district}%"
        
    query = f"""
        SELECT 
            COUNT(*) as total_schools,
            SUM(CASE WHEN teacher_total_tch = 1 THEN 1 ELSE 0 END) as single_teacher,
            SUM(CASE WHEN ({ENROLLMENT_SQL}) = 0 THEN 1 ELSE 0 END) as zero_enrollment,
            SUM({ENROLLMENT_SQL}) as total_students,
            SUM(teacher_total_tch) as total_teachers,
            SUM(CASE WHEN COALESCE(facility_library_availability, 0) = 0 THEN 1 ELSE 0 END) as missing_library,
            SUM(CASE WHEN COALESCE(facility_electricity_availability, 0) = 0 THEN 1 ELSE 0 END) as missing_electricity,
            SUM(CASE WHEN COALESCE(facility_total_boys_func_toilet, 0) = 0 AND COALESCE(facility_total_girls_func_toilet, 0) = 0 THEN 1 ELSE 0 END) as missing_toilet
        FROM school_complete
        {where_clause}
    """
    res = await db.execute(text(query), params)
    r = res.first()
    
    total_schools = int(r[0] or 0)
    single_teacher = int(r[1] or 0)
    zero_enrollment = int(r[2] or 0)
    total_students = int(r[3] or 0)
    total_teachers = int(r[4] or 0)
    missing_library = int(r[5] or 0)
    missing_electricity = int(r[6] or 0)
    missing_toilet = int(r[7] or 0)
    
    ptr = round(total_students / total_teachers, 1) if total_teachers else 0
    d_name = district if district else "The selected area"
    
    insight_text = (
        f"Based on the latest data for {d_name}:\n"
        f"• The district has {single_teacher} single-teacher schools.\n"
        f"• {zero_enrollment} schools currently have zero enrollment and are prime candidates for merger.\n"
        f"• The average Pupil-Teacher Ratio (PTR) is {ptr}:1.\n"
        f"• Infrastructure deficits: {missing_library} schools lack libraries, {missing_electricity} lack electricity, and {missing_toilet} have no functional toilets.\n\n"
        f"I recommend prioritizing teacher redistribution for the single-teacher schools and initiating infrastructure projects for the deficits."
    )
    
    return {"insight": insight_text}
