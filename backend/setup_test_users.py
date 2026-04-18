#!/usr/bin/env python3
"""
Setup test users for different roles.
Run: python setup_test_users.py
"""

import asyncio
from app.database import db as database
from app.utils.password_handler import hash_password

TEST_USERS = [
    {"email": "peon@test.com", "password": "123456", "role": "peon", "name": "Peon User"},
    {"email": "principal@test.com", "password": "123456", "role": "principal", "name": "Principal User"},
    {"email": "deo@test.com", "password": "123456", "role": "deo", "name": "DEO User"},
    {"email": "contractor@test.com", "password": "123456", "role": "contractor", "name": "Contractor User"},
]

async def setup_users():
    """Create test users in the database."""
    await database.connect()
    
    try:
        print("\n🔧 Setting up test users...\n")
        
        for user_data in TEST_USERS:
            # Check if user already exists
            existing = await database.user.find_unique(where={"email": user_data["email"]})
            
            if existing:
                print(f"⚠️  User {user_data['email']} already exists, skipping...")
                continue
            
            # Hash password
            hashed_password = hash_password(user_data["password"])
            
            # Create user
            new_user = await database.user.create(
                data={
                    "name": user_data["name"],
                    "email": user_data["email"],
                    "password": hashed_password,
                    "role": user_data["role"],
                    "school_id": 1,  # Default school
                }
            )
            
            print(f"✅ Created user: {user_data['email']}")
            print(f"   Role: {user_data['role']}")
            print(f"   Password: {user_data['password']}")
            print()
        
        # List all users
        print("\n📋 All users in database:\n")
        all_users = await database.user.find_many()
        
        for user in all_users:
            print(f"  Email: {user.email}")
            print(f"  Role: {user.role}")
            print(f"  Name: {user.name}")
            print(f"  Last Login: {user.last_login or 'Never'}")
            print("  " + "-" * 50)
        
        print("\n✅ Setup complete!\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(setup_users())
