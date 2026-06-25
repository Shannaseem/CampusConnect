from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.student)
    department = Column(String, nullable=True) # Class or department
    is_approved = Column(Integer, default=0) # Using Integer for SQLite/Postgres compatibility (0 = False, 1 = True)

    subjects = relationship("Subject", back_populates="teacher")
    enrollments = relationship("Enrollment", back_populates="student")
