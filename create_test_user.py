#!/usr/bin/env python
"""Create test user for authentication testing"""
import asyncio
from app.database import db
from app.utils.password_handler import hash_password

async def create_test_user():
    await db.connect()
    try:
        # Check if user exists
        existing = await db.user.find_unique(where={"email": "admin@school.com"})
        if existing:
            print("✅ Test user already exists")
            print(f"   Email: {existing.email}")
            print(f"   Name: {existing.name}")
            print(f"   Role: {existing.role}")
            return
        
        # Create test user
        hashed_pwd = hash_password("demo123")
        user = await db.user.create(
            data={
                "name": "Admin",
                "email": "admin@school.com",
                "password": hashed_pwd,
                "role": "principal",
                "school_id": None
            }
        )
        print(f"✅ Test user created successfully!")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.name}")
        print(f"   Role: {user.role}")
        print(f"   ID: {user.id}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(create_test_user())
