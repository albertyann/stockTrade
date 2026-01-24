#!/usr/bin/env python3
import sys
from app.database import engine, Base

def reset_database():
    print("⚠️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)

    print("✅ Creating all tables...")
    Base.metadata.create_all(bind=engine)

    print("✅ Database reset complete!")
    print("\nNext steps:")
    print("1. Run: python init_quant_trading.py  (to seed initial data)")
    print("2. Run: uvicorn app.main:app --reload  (to start the server)")

if __name__ == "__main__":
    reset_database()
