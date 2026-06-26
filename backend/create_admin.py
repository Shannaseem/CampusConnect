import os
import sys

# Add the app directory to the system path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Sabhi zaroori models yahan import kar diye hain taake SQLAlchemy ko koi namaloom (unknown) table na milay
import app.models.subject
import app.models.assignment
import app.models.attendance
import app.models.course_material  # <--- Yeh line add ki gayi hai

from app.db.database import SessionLocal
from app.models.user import User, RoleEnum
from app.core.security import get_password_hash

def create_super_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin_email = "admin@campusconnect.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        
        if existing_admin:
            print(f"Admin with email {admin_email} already exists.")
            return

        # Create new admin
        hashed_password = get_password_hash("Admin@123!")
        new_admin = User(
            name="Super Admin",
            email=admin_email,
            hashed_password=hashed_password,
            role=RoleEnum.admin,
            is_approved=1
        )
        
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        print(f"Super Admin created successfully!")
        print(f"Email: {admin_email}")
        print(f"Password: Admin@123!")
    
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_super_admin()