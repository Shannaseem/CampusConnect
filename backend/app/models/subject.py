from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    teacher_id = Column(Integer, ForeignKey("users.id"))

    teacher = relationship("User", back_populates="subjects")
    enrollments = relationship("Enrollment", back_populates="subject")
    assignments = relationship("Assignment", back_populates="subject")
    attendances = relationship("Attendance", back_populates="subject")
    course_materials = relationship("CourseMaterial", back_populates="subject")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))

    student = relationship("User", back_populates="enrollments")
    subject = relationship("Subject", back_populates="enrollments")
