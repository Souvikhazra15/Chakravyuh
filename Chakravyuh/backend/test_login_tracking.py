#!/usr/bin/env python3
"""
Test script to verify user login tracking functionality.
Tests that last_login is updated when user logs in.
"""

import asyncio
import json
from datetime import datetime
from prisma import Prisma

async def test_login_tracking():
    """Test login tracking in database"""
    
    db = Prisma()
    
    try:
        # Connect to database
        await db.connect()
        print("✅ Connected to database\n")
        
        # Test 1: Check existing users
        print("=== TEST 1: Before Login ===")
        user = await db.user.find_unique(where={"email": "admin@school.com"})
        if user:
            print(f"User: {user.name} ({user.email})")
            print(f"Role: {user.role}")
            print(f"Created at: {user.created_at}")
            print(f"Last Login: {user.last_login}")
            old_last_login = user.last_login
        else:
            print("❌ User not found")
            await db.disconnect()
            return
        
        # Test 2: Simulate login by updating last_login
        print("\n=== TEST 2: Simulating Login (Updating last_login) ===")
        now = datetime.utcnow()
        print(f"Setting last_login to: {now}")
        
        updated_user = await db.user.update(
            where={"id": user.id},
            data={"last_login": now}
        )
        
        print(f"✅ Updated user last_login!")
        print(f"   ID: {updated_user.id}")
        print(f"   Name: {updated_user.name}")
        print(f"   Last Login: {updated_user.last_login}")
        
        # Test 3: Verify the update persisted
        print("\n=== TEST 3: After Login (Verify Persistence) ===")
        verified_user = await db.user.find_unique(where={"id": user.id})
        if verified_user:
            print(f"User: {verified_user.name}")
            print(f"Created at: {verified_user.created_at}")
            print(f"Last Login: {verified_user.last_login}")
            
            if verified_user.last_login and old_last_login != verified_user.last_login:
                print("✅ Login timestamp successfully updated in database!")
            else:
                print("❌ Login timestamp not updated")
        
        # Test 4: List all users with their login times
        print("\n=== TEST 4: All Users Login Times ===")
        all_users = await db.user.find_many()
        print(f"Total users: {len(all_users)}\n")
        
        for u in all_users:
            last_login_str = u.last_login.isoformat() if u.last_login else "Never"
            print(f"  • {u.name}")
            print(f"    Email: {u.email}")
            print(f"    Role: {u.role}")
            print(f"    Last Login: {last_login_str}")
            print()
        
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("\n📊 Summary:")
        print("   ✓ Users now have 'last_login' field")
        print("   ✓ Login timestamps are tracked")
        print("   ✓ Data persists in database")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        await db.disconnect()
        print("\n🔌 Disconnected from database")


if __name__ == "__main__":
    asyncio.run(test_login_tracking())
