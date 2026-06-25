from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.assignment import SubmissionStatus

# Submissions
class SubmissionCreate(BaseModel):
    assignment_id: int
    file_url: Optional[str] = None

class SubmissionGrade(BaseModel):
    marks: int

class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    status: SubmissionStatus
    file_url: Optional[str]
    marks: Optional[int]

    class Config:
        from_attributes = True

# Assignments
class AssignmentCreate(BaseModel):
    subject_id: int
    title: str
    description: str
    deadline: datetime

class AssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    subject_id: int
    title: str
    description: str
    deadline: datetime
    file_url: Optional[str]
    submissions: List[SubmissionResponse] = []

    class Config:
        from_attributes = True
