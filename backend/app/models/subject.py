from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=True)
    description = Column(String, nullable=True)
    department = Column(String, nullable=True)
    
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    teacher = relationship("User", back_populates="subjects")
    enrollments = relationship("Enrollment", back_populates="subject", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="subject", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan")
    course_materials = relationship("CourseMaterial", back_populates="subject", cascade="all, delete-orphan")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"))

    student = relationship("User", back_populates="enrollments")
    subject = relationship("Subject", back_populates="enrollments")