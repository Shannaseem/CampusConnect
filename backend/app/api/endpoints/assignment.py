from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid
from datetime import datetime

from app.db.database import get_db
from app.schemas.assignment import AssignmentCreate, AssignmentResponse, SubmissionCreate, SubmissionResponse, SubmissionGrade
from app.crud import assignment as crud_assignment
from app.api.deps import get_current_user
from app.models.user import User, RoleEnum
from app.models.assignment import Assignment, Submission
from app.models.subject import Subject, Enrollment
from app.core.email_service import send_email

router = APIRouter()

os.makedirs("uploads/assignments", exist_ok=True)
os.makedirs("uploads/submissions", exist_ok=True)

@router.post("/", response_model=AssignmentResponse)
def create_assignment(
    background_tasks: BackgroundTasks,
    subject_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    deadline: datetime = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.teacher and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")
        
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    file_url = None
    if file:
        file_ext = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = f"uploads/assignments/{file_name}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/api/assignments/download/{file_name}"

    assignment_data = AssignmentCreate(
        subject_id=subject_id,
        title=title,
        description=description,
        deadline=deadline
    )
    
    new_assignment = crud_assignment.create_assignment(
        db=db, 
        assignment=assignment_data, 
        teacher_id=current_user.id,
        file_url=file_url
    )

    # Queue email notifications to all enrolled students
    enrollments = db.query(Enrollment).filter(Enrollment.subject_id == subject_id).all()
    for enrollment in enrollments:
        student = db.query(User).filter(User.id == enrollment.student_id).first()
        if student:
            body = f"Hello {student.name},\n\nA new assignment '{title}' has been posted for {subject.title}.\nDeadline: {deadline}\n\nPlease check your student portal."
            background_tasks.add_task(send_email, student.email, f"New Assignment: {title}", body)

    return new_assignment

@router.get("/", response_model=List[AssignmentResponse])
def get_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == RoleEnum.teacher:
        return db.query(Assignment).filter(Assignment.teacher_id == current_user.id).all()
    elif current_user.role == RoleEnum.student:
        enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
        subject_ids = [e.subject_id for e in enrollments]
        return db.query(Assignment).filter(Assignment.subject_id.in_(subject_ids)).all()
    else:
        return db.query(Assignment).all()

@router.post("/submissions", response_model=SubmissionResponse)
def submit_assignment(
    assignment_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.student:
        raise HTTPException(status_code=403, detail="Only students can submit assignments")
        
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    # Strict Deadline check
    if datetime.utcnow() > assignment.deadline:
        raise HTTPException(status_code=400, detail="Deadline has passed. Cannot submit.")

    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = f"uploads/submissions/{file_name}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    file_url = f"/api/assignments/download/submissions/{file_name}"

    submission_data = SubmissionCreate(
        assignment_id=assignment_id,
        file_url=file_url
    )
    return crud_assignment.create_submission(db=db, submission=submission_data, student_id=current_user.id)

@router.post("/submissions/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(submission_id: int, grade: SubmissionGrade, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.teacher and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only teachers can grade submissions")
    submission = crud_assignment.grade_submission(db=db, submission_id=submission_id, marks=grade.marks)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission
