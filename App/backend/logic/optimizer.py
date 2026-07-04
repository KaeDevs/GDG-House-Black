"""
Haversine-based greedy nearest-neighbor optimization logic.

MVP approach: simple greedy matching (not globally optimal).
Production upgrade: Replace with Google OR-Tools or PuLP linear programming solver
for globally optimal teacher-school assignment.
"""

import math
import json
import os
from typing import Optional

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "schools.json")

# RTE Act distance thresholds (km)
RTE_PRIMARY_MAX_KM = 1.0
RTE_UPPER_PRIMARY_MAX_KM = 3.0

# Overload threshold: single teacher with >40 students
OVERLOAD_ENROLLMENT_THRESHOLD = 40

# Max distance for teacher redistribution
TEACHER_REDISTRIBUTION_MAX_KM = 10.0


def load_schools():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth in kilometres.
    Uses the Haversine formula. This is sufficient precision for inter-school distances.
    """
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 3)


def rte_limit(school_type: str) -> float:
    """Return the RTE distance limit for the given school type."""
    return RTE_PRIMARY_MAX_KM if school_type == "primary" else RTE_UPPER_PRIMARY_MAX_KM


def get_school_status(school: dict) -> str:
    """
    Classify a school into one of three statuses:
    - 'zero_enrollment': no students, candidate for closure/merge
    - 'overloaded': single teacher with too many students
    - 'healthy': normal operation
    """
    if school["enrollment"] == 0:
        return "zero_enrollment"
    if school["teacher_count"] == 1 and school["enrollment"] > OVERLOAD_ENROLLMENT_THRESHOLD:
        return "overloaded"
    return "healthy"


def build_recommendations() -> list[dict]:
    """
    Core rationalization engine.

    Greedy nearest-neighbor algorithm:
    1. Flag zero-enrollment schools as merge candidates.
    2. For each, find the nearest same-type non-candidate school (RTE-aware).
    3. Flag single-teacher overloaded schools as understaffed.
    4. Match freed teachers from merges to nearest understaffed schools.

    NOTE: This is intentionally greedy (MVP). For production, replace with:
    - Google OR-Tools CP-SAT solver for vehicle-routing style assignment
    - PuLP for LP-based global optimization
    """
    schools = load_schools()

    # Classify all schools
    for s in schools:
        s["status"] = get_school_status(s)

    zero_enrollment = [s for s in schools if s["status"] == "zero_enrollment"]
    overloaded = [s for s in schools if s["status"] == "overloaded"]
    healthy = [s for s in schools if s["status"] == "healthy"]

    # Track which schools have already been matched (to avoid double-assignment)
    merged_school_ids = set()
    recommendations = []

    # ── STEP 1: Generate MERGE recommendations ────────────────────────────
    freed_teachers = []  # accumulate teachers freed by merges

    for src in zero_enrollment:
        # Find all candidate target schools: same type, not also zero-enrollment
        candidates = [
            s for s in schools
            if s["school_type"] == src["school_type"]
            and s["status"] != "zero_enrollment"
            and s["school_id"] != src["school_id"]
            and s["school_id"] not in merged_school_ids
        ]

        if not candidates:
            continue

        # Greedy: pick the nearest candidate
        candidates_with_dist = [
            (s, haversine(src["lat"], src["lng"], s["lat"], s["lng"]))
            for s in candidates
        ]
        candidates_with_dist.sort(key=lambda x: x[1])
        target, dist = candidates_with_dist[0]

        limit = rte_limit(src["school_type"])
        rte_ok = dist <= limit

        recommendations.append({
            "type": "merge",
            "source_school": src,
            "target_school": target,
            "distance_km": dist,
            "rte_compliant": rte_ok,
            "reasoning": (
                f"Zero-enrollment school '{src['name']}' recommended for closure and merger into "
                f"'{target['name']}' ({dist:.2f} km away). "
                + ("Within RTE distance limit." if rte_ok
                   else f"⚠ Exceeds RTE {limit}km limit — consider intermediate transport provision.")
            ),
        })

        merged_school_ids.add(src["school_id"])

        # Each merged school frees up its teacher(s)
        freed_teachers.extend([src] * src["teacher_count"])

    # ── STEP 2: Generate REDISTRIBUTE recommendations ─────────────────────
    # All overloaded schools plus any that still need teachers
    understaffed = overloaded[:]

    for teacher_source in freed_teachers:
        if not understaffed:
            break  # no more understaffed schools to fill

        # Find nearest understaffed school within redistribution cap
        candidates_with_dist = [
            (s, haversine(
                teacher_source["lat"], teacher_source["lng"],
                s["lat"], s["lng"]
            ))
            for s in understaffed
        ]
        candidates_with_dist.sort(key=lambda x: x[1])
        target, dist = candidates_with_dist[0]

        if dist > TEACHER_REDISTRIBUTION_MAX_KM:
            # Too far for practical redistribution — skip
            continue

        recommendations.append({
            "type": "redistribute",
            "source_school": teacher_source,
            "target_school": target,
            "distance_km": dist,
            "rte_compliant": True,  # teacher redistribution has no strict RTE distance limit
            "reasoning": (
                f"Teacher freed from '{teacher_source['name']}' (merged school) recommended "
                f"for redeployment to '{target['name']}' ({dist:.2f} km away), "
                f"which has {target['enrollment']} students but only {target['teacher_count']} teacher(s)."
            ),
        })

        # Remove matched school from understaffed list (greedy: one teacher per school for MVP)
        understaffed.remove(target)

    return recommendations


def get_summary_stats(schools: list[dict]) -> dict:
    """Return aggregated statistics for the stat cards on the dashboard."""
    total = len(schools)
    zero_enroll = sum(1 for s in schools if s["enrollment"] == 0)
    overloaded_count = sum(
        1 for s in schools
        if s["teacher_count"] == 1 and s["enrollment"] > OVERLOAD_ENROLLMENT_THRESHOLD
    )
    total_students = sum(s["enrollment"] for s in schools)
    total_teachers = sum(s["teacher_count"] for s in schools)

    return {
        "total_schools": total,
        "zero_enrollment_schools": zero_enroll,
        "overloaded_schools": overloaded_count,
        "healthy_schools": total - zero_enroll - overloaded_count,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "avg_student_teacher_ratio": round(total_students / total_teachers, 1) if total_teachers else 0,
    }
