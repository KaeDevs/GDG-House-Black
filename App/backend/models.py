from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class DashboardStats(BaseModel):
    total_schools: int
    total_students: int
    total_teachers: int
    state_wise_schools: Dict[str, int]
    district_wise_schools: Dict[str, int]
    infrastructure_summary: Dict[str, Any]
    teacher_summary: Dict[str, Any]
    enrollment_summary: Dict[str, Any]
    student_teacher_ratio: float
    schools_without_electricity: int
    schools_without_internet: int
    schools_without_toilets: int
    single_teacher_schools: int

class SchoolResponse(BaseModel):
    pseudocode: Optional[str]
    udise_code: Optional[str]
    state: Optional[str]
    district: Optional[str]
    block: Optional[str]
    # Other dynamic fields will be included as generic dicts for flexible views
