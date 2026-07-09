"""
Haversine-based greedy nearest-neighbor optimization logic and SQL query builders.
"""

import math
import hashlib
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

# RTE Act distance thresholds (km)
RTE_PRIMARY_MAX_KM = 1.0
RTE_UPPER_PRIMARY_MAX_KM = 3.0

# Overload threshold: single teacher with >40 students
OVERLOAD_ENROLLMENT_THRESHOLD = 40

# Max distance for teacher redistribution
TEACHER_REDISTRIBUTION_MAX_KM = 10.0

ENROLLMENT_COLS = [
    'enrolment1_cpp_b', 'enrolment1_cpp_g', 'enrolment1_c1_b', 'enrolment1_c1_g', 
    'enrolment1_c2_b', 'enrolment1_c2_g', 'enrolment1_c3_b', 'enrolment1_c3_g', 
    'enrolment1_c4_b', 'enrolment1_c4_g', 'enrolment1_c5_b', 'enrolment1_c5_g', 
    'enrolment1_c6_b', 'enrolment1_c6_g', 'enrolment1_c7_b', 'enrolment1_c7_g', 
    'enrolment1_c8_b', 'enrolment1_c8_g', 'enrolment1_c9_b', 'enrolment1_c9_g', 
    'enrolment1_c10_b', 'enrolment1_c10_g', 'enrolment1_c11_b', 'enrolment1_c11_g', 
    'enrolment1_c12_b', 'enrolment1_c12_g'
]
ENROLLMENT_SQL = " + ".join([f"COALESCE({c}, 0)" for c in ENROLLMENT_COLS])
VALID_DATA_CONDITION = f"(COALESCE(teacher_total_tch, 0) > 0 OR ({ENROLLMENT_SQL}) > 0)"

def generate_coords(school_id: str, district: str) -> tuple[float, float]:
    # generic fallback center for India if not mapped
    center = [20.5937, 78.9629]
    h = int(hashlib.md5(school_id.encode()).hexdigest(), 16)
    # deterministic random offset
    lat_offset = ((h % 1000) / 50.0) - 1.0
    lng_offset = (((h // 1000) % 1000) / 50.0) - 1.0
    return round(center[0] + lat_offset, 4), round(center[1] + lng_offset, 4)


async def get_available_districts(db: AsyncSession) -> list[dict]:
    query = text(f"""
        SELECT DISTINCT district, state 
        FROM school_complete 
        WHERE district IS NOT NULL AND state IS NOT NULL AND {VALID_DATA_CONDITION}
        ORDER BY state, district
    """)
    res = await db.execute(query)
    districts = []
    for row in res:
        d = row.district
        s = row.state
        districts.append({
            "id": d,
            "name": d,
            "state": s,
            "center": [], # Map component should handle bounds automatically or we ignore it
            "zoom": 10,
        })
    return districts


def format_school_row(row_mapping: dict) -> dict:
    sid = str(row_mapping.get("pseudocode") or "")
    d = row_mapping.get("district") or "Unknown"
    
    # Check if lat/long exist in db row, else generate
    lat = row_mapping.get("latitude") or row_mapping.get("lat")
    lng = row_mapping.get("longitude") or row_mapping.get("lon")
    if not lat or not lng:
        lat, lng = generate_coords(sid, d)
        
    enrollment = int(row_mapping.get("total_enrollment") or 0)
    teacher_count = int(row_mapping.get("teacher_total_tch") or 0)
    
    status = "healthy"
    if enrollment == 0:
        status = "zero_enrollment"
    elif teacher_count == 1 and enrollment > OVERLOAD_ENROLLMENT_THRESHOLD:
        status = "overloaded"
    elif teacher_count == 0 and enrollment > 0:
        status = "understaffed"

    return {
        "school_id": sid,
        "name": f"{row_mapping.get('school_category', 'School')} {row_mapping.get('lgd_vill_name', sid)}",
        "lat": lat,
        "lng": lng,
        "enrollment": enrollment,
        "teacher_count": teacher_count,
        "school_type": row_mapping.get("school_type", "primary"),
        "block": row_mapping.get("block", ""),
        "district": d,
        "status": status,
        "facilities": {
            "electricity": bool(row_mapping.get("facility_electricity_availability")),
            "water": bool(row_mapping.get("facility_pack_water_fun_yn") or row_mapping.get("facility_pack_water_yn")),
            "toilet": bool(row_mapping.get("facility_total_boys_func_toilet") or row_mapping.get("facility_total_girls_func_toilet")),
            "boundary_wall": bool(row_mapping.get("facility_boundary_wall")),
            "library": bool(row_mapping.get("facility_library_availability"))
        }
    }


async def build_recommendations(db: AsyncSession, district: Optional[str] = None) -> list[dict]:
    # We only fetch schools that need recommendations or can be targets to save memory.
    # But to keep it simple and within the limit of memory for a single district,
    # we can fetch the necessary columns for all schools in the district.
    query_str = f"""
        SELECT 
            pseudocode, district, lgd_vill_name, school_category, school_type, block,
            teacher_total_tch,
            ({ENROLLMENT_SQL}) as total_enrollment,
            facility_electricity_availability, facility_pack_water_yn, facility_pack_water_fun_yn,
            facility_total_boys_func_toilet, facility_total_girls_func_toilet, facility_boundary_wall, facility_library_availability
        FROM school_complete
        WHERE {VALID_DATA_CONDITION}
    """
    
    params = {}
    if district:
        query_str += " AND district ILIKE :district"
        params["district"] = f"%{district}%"
        
    res = await db.execute(text(query_str), params)
    schools = [format_school_row(dict(row._mapping)) for row in res]

    recommendations = []
    
    # Track schools to avoid double assignment
    merged_school_ids = set()
    freed_teachers = []

    zero_enrollment = [s for s in schools if s["status"] == "zero_enrollment"]
    overloaded = [s for s in schools if s["status"] == "overloaded"]
    understaffed = overloaded[:] # clone

    # Merge recommendations
    for src in zero_enrollment:
        candidates = [
            s for s in schools
            if s["school_type"] == src["school_type"]
            and s["status"] != "zero_enrollment"
            and s["school_id"] != src["school_id"]
            and s["school_id"] not in merged_school_ids
        ]

        if candidates:
            candidates_with_dist = [(s, haversine(src["lat"], src["lng"], s["lat"], s["lng"])) for s in candidates]
            candidates_with_dist.sort(key=lambda x: x[1])
            target, dist = candidates_with_dist[0]
            
            rte_ok = dist <= (RTE_PRIMARY_MAX_KM if src["school_type"] == "primary" else RTE_UPPER_PRIMARY_MAX_KM)

            recommendations.append({
                "type": "merge",
                "source_school": src,
                "target_school": target,
                "distance_km": dist,
                "rte_compliant": rte_ok,
                "reasoning": f"Zero-enrollment school '{src['name']}' recommended for closure and merger into '{target['name']}' ({dist:.2f} km away)."
            })
            merged_school_ids.add(src["school_id"])
            freed_teachers.extend([src] * src["teacher_count"])
            
    # Redistribute recommendations
    for teacher_source in freed_teachers:
        if not understaffed:
            break
            
        candidates_with_dist = [(s, haversine(teacher_source["lat"], teacher_source["lng"], s["lat"], s["lng"])) for s in understaffed]
        candidates_with_dist.sort(key=lambda x: x[1])
        target, dist = candidates_with_dist[0]
        
        if dist <= TEACHER_REDISTRIBUTION_MAX_KM:
            recommendations.append({
                "type": "redistribute",
                "source_school": teacher_source,
                "target_school": target,
                "distance_km": dist,
                "rte_compliant": True,
                "reasoning": f"Teacher freed from '{teacher_source['name']}' recommended for redeployment to overloaded school '{target['name']}' ({dist:.2f} km away)."
            })
            understaffed.remove(target)

    # Infrastructure recommendations
    for s in schools:
        if s["status"] == "zero_enrollment" or s["school_id"] in merged_school_ids:
            continue
            
        if not s["facilities"]["water"]:
            recommendations.append({
                "type": "infrastructure",
                "source_school": s,
                "reasoning": f"School '{s['name']}' is missing functional drinking water facilities."
            })
        if not s["facilities"]["toilet"]:
            recommendations.append({
                "type": "infrastructure",
                "source_school": s,
                "reasoning": f"School '{s['name']}' requires urgent toilet construction."
            })
        if not s["facilities"]["electricity"]:
            recommendations.append({
                "type": "infrastructure",
                "source_school": s,
                "reasoning": f"School '{s['name']}' lacks electricity connection."
            })

    return recommendations

def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 3)

def get_summary_stats(schools: list[dict]) -> dict:
    total = len(schools)
    zero_enroll = sum(1 for s in schools if s["status"] == "zero_enrollment")
    single_teacher = sum(1 for s in schools if s["teacher_count"] == 1)
    overloaded_count = sum(1 for s in schools if s["status"] == "overloaded")
    
    total_students = sum(s["enrollment"] for s in schools)
    total_teachers = sum(s["teacher_count"] for s in schools)
    
    students_affected = sum(s["enrollment"] for s in schools if s["status"] != "healthy")
    
    return {
        "total_schools": total,
        "zero_enrollment_schools": zero_enroll,
        "overloaded_schools": overloaded_count,
        "single_teacher_schools": single_teacher,
        "healthy_schools": total - zero_enroll - overloaded_count,
        "total_students": total_students,
        "students_affected": students_affected,
        "total_teachers": total_teachers,
        "avg_student_teacher_ratio": round(total_students / total_teachers, 1) if total_teachers else 0,
    }
