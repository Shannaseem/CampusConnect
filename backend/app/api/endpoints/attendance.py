from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.db.database import get_db
from app.schemas.attendance import AttendanceCreate, AttendanceResponse
from app.crud import attendance as crud_attendance
from app.api.deps import get_current_user
from app.models.user import User, RoleEnum
from app.models.subject import Subject
from app.core.email_service import send_email

router = APIRouter()

@router.post("/", response_model=AttendanceResponse)
def mark_attendance(
    attendance: AttendanceCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    user_role = str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role).lower()
    if user_role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers or admins can mark attendance")
        
    student = db.query(User).filter(User.id == attendance.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    subject = db.query(Subject).filter(Subject.id == attendance.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    new_attendance = crud_attendance.create_attendance(db=db, attendance=attendance)

    # Queue email notification if absent or late
    if attendance.status in ["absent", "late"]:
        body = f"Dear {student.name},\n\nYou have been marked '{attendance.status}' for {subject.title} on {attendance.date}.\n\nPlease ensure you maintain good attendance."
        background_tasks.add_task(send_email, student.email, f"Attendance Alert: {subject.title}", body)

    return new_attendance

@router.get("/student/{student_id}", response_model=List[AttendanceResponse])
def get_student_attendance(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Students can only view their own attendance
    user_role = str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role).lower()
    if user_role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other student's attendance")
    return crud_attendance.get_attendance_by_student(db, student_id=student_id)

@router.get("/date/{target_date}", response_model=List[AttendanceResponse])
def get_date_attendance(target_date: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_role = str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role).lower()
    if user_role == "student":
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud_attendance.get_attendance_by_date(db, target_date=target_date)
