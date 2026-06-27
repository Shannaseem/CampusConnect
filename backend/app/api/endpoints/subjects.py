from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.subject import Subject, Enrollment
from app.models.user import User, RoleEnum
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate, EnrollmentResponse
from app.api import deps

router = APIRouter()

@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_new_subject(
    subject_in: SubjectCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if current_user.role not in [RoleEnum.teacher, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Not authorized to create subjects")

    if subject_in.code:
        existing = db.query(Subject).filter(Subject.code == subject_in.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Subject code already registered.")
    
    if subject_in.teacher_id:
        teacher = db.query(User).filter(User.id == subject_in.teacher_id, User.role == RoleEnum.teacher).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found.")

    db_subject = Subject(
        title=subject_in.title,
        code=subject_in.code,
        description=subject_in.description,
        department=subject_in.department,
        teacher_id=subject_in.teacher_id or (current_user.id if current_user.role == RoleEnum.teacher else None)
    )
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.get("/", response_model=List[SubjectResponse])
def get_all_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if current_user.role == RoleEnum.teacher:
        return db.query(Subject).filter(Subject.teacher_id == current_user.id).all()
    elif current_user.role == RoleEnum.student:
        enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
        subject_ids = [e.subject_id for e in enrollments]
        return db.query(Subject).filter(Subject.id.in_(subject_ids)).all()
    else:
        return db.query(Subject).all()

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    subject_update: SubjectUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if subject_update.teacher_id is not None:
        if subject_update.teacher_id == 0:
            db_subject.teacher_id = None
        else:
            teacher = db.query(User).filter(User.id == subject_update.teacher_id, User.role == RoleEnum.teacher).first()
            if not teacher:
                raise HTTPException(status_code=404, detail="Teacher not found.")
            db_subject.teacher_id = subject_update.teacher_id

    if subject_update.title:
        db_subject.title = subject_update.title
    if subject_update.code:
        db_subject.code = subject_update.code
    if subject_update.department:
        db_subject.department = subject_update.department
    if subject_update.description is not None:
        db_subject.description = subject_update.description

    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
):
    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(db_subject)
    db.commit()
    return {"detail": "Subject deleted"}