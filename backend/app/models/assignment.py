from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base

class SubmissionStatus(str, enum.Enum):
    pending = "pending"
    submitted = "submitted"
    graded = "graded"

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    title = Column(String, index=True)
    description = Column(String)
    deadline = Column(DateTime)
    file_url = Column(String, nullable=True) # Teacher's attached file

    teacher = relationship("User")
    subject = relationship("Subject", back_populates="assignments")
    submissions = relationship("Submission", back_populates="assignment")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.pending)
    file_url = Column(String, nullable=True)
    marks = Column(Integer, nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User")
