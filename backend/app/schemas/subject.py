from pydantic import BaseModel
from typing import Optional, List

class SubjectBase(BaseModel):
    title: str
    description: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    teacher_id: int

    class Config:
        from_attributes = True

class EnrollmentCreate(BaseModel):
    subject_id: int
    student_id: int

class EnrollmentResponse(BaseModel):
    id: int
    subject_id: int
    student_id: int

    class Config:
        from_attributes = True
