from sqlalchemy.orm import Session
from app.models.assignment import Assignment, Submission, SubmissionStatus
from app.schemas.assignment import AssignmentCreate, SubmissionCreate

def create_assignment(db: Session, assignment: AssignmentCreate, teacher_id: int, file_url: str = None):
    db_assignment = Assignment(
        teacher_id=teacher_id,
        subject_id=assignment.subject_id,
        title=assignment.title,
        description=assignment.description,
        deadline=assignment.deadline,
        file_url=file_url
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def get_all_assignments(db: Session):
    return db.query(Assignment).all()

def create_submission(db: Session, submission: SubmissionCreate, student_id: int):
    db_submission = Submission(
        assignment_id=submission.assignment_id,
        student_id=student_id,
        file_url=submission.file_url,
        status=SubmissionStatus.submitted
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission

def grade_submission(db: Session, submission_id: int, marks: int):
    db_submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if db_submission:
        db_submission.marks = marks
        db_submission.status = SubmissionStatus.graded
        db.commit()
        db.refresh(db_submission)
    return db_submission
