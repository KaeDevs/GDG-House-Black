"""GET /api/schools — Returns all school records with their status classification."""

from fastapi import APIRouter
from logic.optimizer import load_schools, get_school_status, get_summary_stats

router = APIRouter()


@router.get("/schools")
async def get_schools():
    """
    Returns all schools with a computed `status` field:
    - zero_enrollment: no students, merge candidate
    - overloaded: 1 teacher, >40 students
    - healthy: normal
    """
    schools = load_schools()
    for school in schools:
        school["status"] = get_school_status(school)

    stats = get_summary_stats(schools)

    return {
        "schools": schools,
        "stats": stats,
        "count": len(schools),
    }
