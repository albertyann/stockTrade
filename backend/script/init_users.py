import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.crud.user import create_user, get_user_by_username
from app.schemas.user import UserCreate

def create_admin_user():
    db = SessionLocal()
    
    try:
        username = "admin"
        password = "1234567890"
        email = "admin@example.com"
        
        existing_user = get_user_by_username(db, username=username)
        if existing_user:
            print(f"User '{username}' already exists.")
            return
        
        user_create = UserCreate(
            username=username,
            email=email,
            password=password
        )
        
        user = create_user(db, user_create)
        print(f"Admin user created successfully!")
        print(f"  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Password: {password}")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user()
