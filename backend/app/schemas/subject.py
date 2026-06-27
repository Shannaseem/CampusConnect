from pydantic import BaseModel
from typing import Optional, List

class SubjectBase(BaseModel):
    title: str
    code: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None

class SubjectCreate(SubjectBase):
    teacher_id: Optional[int] = None

class SubjectUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    teacher_id: Optional[int] = None

class SubjectResponse(SubjectBase):
    id: int
    teacher_id: Optional[int] = None

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