#!/usr/bin/env python3
"""
Test login functionality for all roles and verify last_login timestamp updates.
"""
import asyncio
import httpx
from datetime import datetime
from app.database import db as database

BASE_URL = "http://127.0.0.1:8001"

TEST_CREDENTIALS = [
    {"email": "peon@test.com", "password": "123456", "role": "peon"},
    {"email": "principal@test.com", "password": "123456", "role": "principal"},
    {"email": "deo@test.com", "password": "123456", "role": "deo"},
    {"email": "contractor@test.com", "password": "123456", "role": "contractor"},
]

async def test_login():
    """Test login and verify last_login updates for each role."""
    print("\n" + "="*70)
    print("🔐 TESTING LOGIN & LAST_LOGIN TRACKING FOR ALL ROLES")
    print("="*70 + "\n")
    
    await database.connect()
    
    try:
        async with httpx.AsyncClient() as client:
            for cred in TEST_CREDENTIALS:
                print(f"\n{'─'*70}")
                print(f"Testing: {cred['role'].upper()}")
                print(f"{'─'*70}")
                
                # Get user BEFORE login
                user_before = await database.user.find_unique(
                    where={"email": cred["email"]}
                )
                print(f"\n📋 BEFORE LOGIN:")
                print(f"   Email: {user_before.email}")
                print(f"   Role: {user_before.role}")
                print(f"   Last Login: {user_before.last_login or 'NULL (Never logged in)'}")
                
                # Attempt login
                print(f"\n🔑 Attempting login...")
                try:
                    response = await client.post(
                        f"{BASE_URL}/api/v1/auth/login",
                        json={
                            "email": cred["email"],
                            "password": cred["password"]
                        },
                        timeout=5.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"   ✅ Login successful!")
                        print(f"   Token: {data['access_token'][:20]}...")
                        print(f"   User ID: {data['user_id']}")
                    else:
                        print(f"   ❌ Login failed (Status: {response.status_code})")
                        print(f"   Response: {response.text}")
                        continue
                        
                except Exception as e:
                    print(f"   ❌ Error during login: {e}")
                    continue
                
                # Small delay to ensure DB update completes
                await asyncio.sleep(0.5)
                
                # Get user AFTER login
                user_after = await database.user.find_unique(
                    where={"email": cred["email"]}
                )
                print(f"\n✨ AFTER LOGIN:")
                print(f"   Email: {user_after.email}")
                print(f"   Role: {user_after.role}")
                print(f"   Last Login: {user_after.last_login}")
                
                # Verify update
                if user_after.last_login and (user_before.last_login is None or user_after.last_login > user_before.last_login):
                    print(f"\n   ✅ VERIFIED: last_login timestamp updated!")
                else:
                    print(f"\n   ⚠️  WARNING: last_login was not updated")
        
        # Final summary
        print(f"\n\n{'='*70}")
        print("📊 FINAL DATABASE STATE (ALL USERS):")
        print(f"{'='*70}\n")
        
        all_users = await database.user.find_many()
        for user in all_users:
            if user.email in [c["email"] for c in TEST_CREDENTIALS]:
                status = "🟢 Has logged in" if user.last_login else "🔴 Never logged in"
                print(f"{status}  {user.email:25} ({user.role:12}) - Last Login: {user.last_login or 'NULL'}")
        
        print(f"\n{'='*70}\n")
        
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(test_login())
