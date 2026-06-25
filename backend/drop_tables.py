import os
import sys
from sqlalchemy import text

# Add the app directory to the system path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine

def drop_tables():
    with engine.connect() as conn:
        try:
            conn.execute(text("DROP TABLE IF EXISTS submissions CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS assignments CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS attendance CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS course_materials CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS enrollments CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS subjects CASCADE;"))
            conn.commit()
            print("Successfully dropped tables for recreation.")
        except Exception as e:
            print(f"Error dropping tables: {e}")

if __name__ == "__main__":
    drop_tables()
