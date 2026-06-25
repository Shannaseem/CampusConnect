import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import Base, engine
from app.models import user, attendance, assignment, subject, course_material

def recreate_db():
    print("Recreating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    recreate_db()
