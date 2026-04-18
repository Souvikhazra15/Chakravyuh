"""
Prisma ORM Database Configuration
Async SQLite connection with Prisma
"""
from prisma import Prisma
from typing import AsyncGenerator
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Prisma client
db = Prisma(auto_register=True)

async def connect_db():
    """Connect to database"""
    await db.connect()
    print("✅ Prisma connected to SQLite (dev.db)")

async def disconnect_db():
    """Disconnect from database"""
    await db.disconnect()
    print("🛑 Prisma disconnected from SQLite")

async def get_db():
    """Dependency for FastAPI to get database connection"""
    return db

# For backwards compatibility with existing imports
Base = None  # Not needed with Prisma

async def init_db():
    """Initialize database schema and keep connection open"""
    try:
        # Connect to database and keep it open for the app lifecycle
        await db.connect()
        print("✅ Database initialized via Prisma SQLite")
        print("✅ Prisma client connected and ready")
    except Exception as e:
        print(f"⚠️  Database initialization error: {e}")
        print("   Make sure prisma migrate dev has been run and dev.db exists")
        raise

async def close_db():
    """Close database connection on app shutdown"""
    try:
        await db.disconnect()
        print("🛑 Prisma disconnected from SQLite")
    except Exception as e:
        print(f"⚠️  Error disconnecting database: {e}")
