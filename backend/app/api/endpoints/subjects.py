from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User, RoleEnum
from app.models.subject import Subject, Enrollment
from app.schemas.subject import SubjectCreate, SubjectResponse, EnrollmentCreate, EnrollmentResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=SubjectResponse)
def create_subject(
    subject: SubjectCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.teacher and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only teachers and admins can create subjects")
    
    new_subject = Subject(
        title=subject.title,
        description=subject.description,
        teacher_id=current_user.id
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return new_subject

@router.get("/", response_model=List[SubjectResponse])
def get_subjects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == RoleEnum.teacher:
        subjects = db.query(Subject).filter(Subject.teacher_id == current_user.id).all()
    elif current_user.role == RoleEnum.student:
        # Get subjects student is enrolled in
        enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
        subject_ids = [e.subject_id for e in enrollments]
        subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all()
    else: # admin
        subjects = db.query(Subject).all()
    return subjects

@router.post("/{subject_id}/enroll", response_model=EnrollmentResponse)
def enroll_student(
    subject_id: int, 
    student_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.teacher and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only teachers and admins can enroll students")
        
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    student = db.query(User).filter(User.id == student_id, User.role == RoleEnum.student).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.subject_id == subject_id, 
        Enrollment.student_id == student_id
    ).first()

    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Student is already enrolled in this subject")

    new_enrollment = Enrollment(subject_id=subject_id, student_id=student_id)
    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)
    return new_enrollment
