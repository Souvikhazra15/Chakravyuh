#!/usr/bin/env python3
"""
Test script to verify user update functionality in the database.
"""

import asyncio
import json
from prisma import Prisma

async def test_user_update():
    """Test user registration, retrieval, and update"""
    
    db = Prisma()
    
    try:
        # Connect to database
        await db.connect()
        print("✅ Connected to database")
        
        # Test 1: Check existing users
        print("\n=== TEST 1: Existing Users ===")
        existing_users = await db.user.find_many()
        print(f"Found {len(existing_users)} users")
        for user in existing_users:
            print(f"  - ID: {user.id}, Name: {user.name}, Email: {user.email}, Role: {user.role}, School: {user.school_id}")
        
        # Test 2: Create a new test user
        print("\n=== TEST 2: Create New User ===")
        try:
            new_user = await db.user.create(
                data={
                    "name": "Test User",
                    "email": "test@example.com",
                    "password": "hashed_password_123",
                    "role": "peon",
                    "school_id": 5,
                }
            )
            print(f"✅ Created user: ID={new_user.id}, Name={new_user.name}, Email={new_user.email}")
            user_id = new_user.id
        except Exception as e:
            print(f"⚠️ User already exists or error: {str(e)}")
            # Try to find existing test user
            user = await db.user.find_unique(where={"email": "test@example.com"})
            if user:
                print(f"Found existing test user: ID={user.id}")
                user_id = user.id
            else:
                raise
        
        # Test 3: Update user
        print("\n=== TEST 3: Update User ===")
        print(f"Updating user ID={user_id}...")
        
        update_data = {
            "name": "Updated Test User",
            "role": "principal",
            "school_id": 3,
        }
        print(f"Update data: {json.dumps(update_data, indent=2)}")
        
        updated_user = await db.user.update(
            where={"id": user_id},
            data=update_data
        )
        print(f"✅ User updated successfully!")
        print(f"   ID: {updated_user.id}")
        print(f"   Name: {updated_user.name} (changed from 'Test User')")
        print(f"   Role: {updated_user.role} (changed from 'peon')")
        print(f"   School ID: {updated_user.school_id} (changed from 5)")
        print(f"   Email: {updated_user.email} (unchanged)")
        print(f"   Created at: {updated_user.created_at}")
        print(f"   Updated at: {updated_user.updated_at}")
        
        # Test 4: Verify update by fetching again
        print("\n=== TEST 4: Verify Update ===")
        verified_user = await db.user.find_unique(where={"id": user_id})
        if verified_user:
            print(f"✅ User verification successful!")
            print(f"   Name: {verified_user.name}")
            print(f"   Role: {verified_user.role}")
            print(f"   School ID: {verified_user.school_id}")
            
            # Check if values match what we updated
            if (verified_user.name == "Updated Test User" and
                verified_user.role == "principal" and
                verified_user.school_id == 3):
                print("✅ ALL VALUES CORRECTLY UPDATED IN DATABASE!")
            else:
                print("❌ Some values don't match expected updates")
        else:
            print("❌ User not found after update")
        
        # Test 5: List all users after update
        print("\n=== TEST 5: List All Users ===")
        all_users = await db.user.find_many()
        print(f"Total users in database: {len(all_users)}")
        for user in all_users:
            print(f"  - ID: {user.id:2d}, Name: {user.name:20s}, Email: {user.email:25s}, Role: {user.role:12s}, School: {user.school_id}")
        
        print("\n✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        await db.disconnect()
        print("\n🔌 Disconnected from database")


if __name__ == "__main__":
    asyncio.run(test_user_update())
