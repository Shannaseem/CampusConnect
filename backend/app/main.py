from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
from app.api.endpoints import auth, users, attendance, assignment, subjects, analytics

# Import models so SQLAlchemy creates them
from app.models import user, attendance as attendance_model, assignment as assignment_model, subject as subject_model, course_material as course_material_model

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:8000", "http://127.0.0.1:8000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["subjects"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(assignment.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Student Productivity Platform API!"}
