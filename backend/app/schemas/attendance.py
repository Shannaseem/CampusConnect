from pydantic import BaseModel
from datetime import date
from typing import Optional
from app.models.attendance import AttendanceStatus

class AttendanceCreate(BaseModel):
    student_id: int
    subject_id: int
    date: date
    status: AttendanceStatus

class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    subject_id: int
    date: date
    status: AttendanceStatus

    class Config:
        from_attributes = True
