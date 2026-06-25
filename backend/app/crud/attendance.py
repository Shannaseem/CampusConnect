from sqlalchemy.orm import Session
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate
from datetime import date

def create_attendance(db: Session, attendance: AttendanceCreate):
    db_attendance = Attendance(
        student_id=attendance.student_id,
        subject_id=attendance.subject_id,
        date=attendance.date,
        status=attendance.status
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def get_attendance_by_student(db: Session, student_id: int):
    return db.query(Attendance).filter(Attendance.student_id == student_id).all()

def get_attendance_by_date(db: Session, target_date: date):
    return db.query(Attendance).filter(Attendance.date == target_date).all()
