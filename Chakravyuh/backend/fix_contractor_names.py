#!/usr/bin/env python3
"""
Fix contractor account names to match DEO dashboard contractor list.
Run: python fix_contractor_names.py
"""

import asyncio
from app.database import db as database

CONTRACTOR_UPDATES = [
    {"email": "contractor@test.com", "name": "Suresh Kumar"},
    {"email": "contractor1@test.com", "name": "Suresh Kumar"},
    {"email": "contractor2@test.com", "name": "Ramesh Patel"},
    {"email": "contractor3@test.com", "name": "Rajendra Singh"},
]

async def fix_names():
    """Update contractor names to match DEO dashboard."""
    await database.connect()
    
    try:
        print("\n🔧 Updating contractor names...\n")
        
        for update in CONTRACTOR_UPDATES:
            user = await database.user.find_unique(where={"email": update["email"]})
            
            if not user:
                print(f"⚠️  User {update['email']} not found, skipping...")
                continue
            
            # Update name
            updated = await database.user.update(
                where={"email": update["email"]},
                data={"name": update["name"]}
            )
            
            print(f"✅ Updated {update['email']}")
            print(f"   New name: {updated.name}")
            print()
        
        # List all contractors
        print("\n📋 All contractors in database:\n")
        all_users = await database.user.find_many(
            where={"role": "contractor"}
        )
        
        for user in all_users:
            print(f"  Email: {user.email}")
            print(f"  Name: {user.name}")
            print("  " + "-" * 50)
        
        print("\n✅ Update complete!\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(fix_names())
