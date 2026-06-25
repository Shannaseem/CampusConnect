from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.db.database import get_db
from app.models.user import User, RoleEnum
from app.models.attendance import Attendance
from app.models.assignment import Assignment, Submission
from app.models.subject import Subject, Enrollment
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/student/{student_id}/report")
def get_student_report(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_role = str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role).lower()
    
    if user_role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Can only view your own report")

    student = db.query(User).filter(User.id == student_id, User.role == RoleEnum.student).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Fetch subjects
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    subject_ids = [e.subject_id for e in enrollments]
    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all()

    report = {
        "student_name": student.name,
        "email": student.email,
        "subjects_enrolled": len(subjects),
        "attendance_summary": {},
        "assignment_summary": {},
        "subject_details": []
    }

    total_present = db.query(Attendance).filter(Attendance.student_id == student_id, Attendance.status == "present").count()
    total_absent = db.query(Attendance).filter(Attendance.student_id == student_id, Attendance.status == "absent").count()
    total_late = db.query(Attendance).filter(Attendance.student_id == student_id, Attendance.status == "late").count()

    report["attendance_summary"] = {
        "present": total_present,
        "absent": total_absent,
        "late": total_late,
        "total_classes": total_present + total_absent + total_late
    }

    # Fetch assignments and marks
    submissions = db.query(Submission).filter(Submission.student_id == student_id).all()
    total_marks = sum([sub.marks for sub in submissions if sub.marks is not None])
    total_graded = sum([1 for sub in submissions if sub.status == "graded"])

    report["assignment_summary"] = {
        "total_submitted": len(submissions),
        "total_graded": total_graded,
        "total_marks_obtained": total_marks
    }

    # Breakdown by subject
    for subject in subjects:
        subj_attendance = db.query(Attendance).filter(Attendance.student_id == student_id, Attendance.subject_id == subject.id).count()
        subj_assignments = db.query(Assignment).filter(Assignment.subject_id == subject.id).all()
        subj_assignment_ids = [a.id for a in subj_assignments]
        
        subj_submissions = db.query(Submission).filter(
            Submission.student_id == student_id, 
            Submission.assignment_id.in_(subj_assignment_ids)
        ).all()

        subj_marks = sum([s.marks for s in subj_submissions if s.marks is not None])

        report["subject_details"].append({
            "subject_id": subject.id,
            "subject_title": subject.title,
            "attendance_count": subj_attendance,
            "assignments_count": len(subj_assignments),
            "marks_obtained": subj_marks
        })

    return report
