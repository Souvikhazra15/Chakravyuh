"""
Seed script to populate database with test data
Run: python seed.py
"""

import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import AsyncSessionLocal, init_db
from app.models import Report, WorkOrder, Repair


async def seed_database():
    """Populate database with test data."""
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if data already exists
        result = await session.execute(select(Report))
        if result.scalars().first():
            print("Database already seeded!")
            return

        print("🌱 Seeding database with test data...")

        schools = list(range(1, 6))
        categories = ["plumbing", "electrical", "structural"]
        conditions = ["good", "minor", "major"]

        now = datetime.utcnow()

        for school_id in schools:
            for category in categories:
                for i in range(8):
                    report = Report(
                        school_id=school_id,
                        category=category,
                        condition=random.choice(conditions),
                        condition_score=random.choice([0.0, 1.0, 3.0]),
                        photo_url=f"https://example.com/photo_{school_id}_{category}_{i}.jpg",
                        timestamp=now - timedelta(days=i * 7),
                    )
                    session.add(report)

        for i in range(5):
            work = WorkOrder(
                school_id=random.choice(schools),
                category=random.choice(categories),
                assigned_to=f"Contractor {i+1}",
                status="pending" if i < 3 else "completed",
                created_at=now - timedelta(days=i),
            )
            session.add(work)

        for i in range(3):
            repair = Repair(
                work_order_id=i + 1,
                school_id=random.choice(schools),
                category=random.choice(categories),
                photo_url=f"https://example.com/repair_{i}.jpg",
                gps_location=f"{20 + random.random()},{78 + random.random()}",
                notes=f"Repair #{i+1} completed successfully",
                completed_at=now - timedelta(days=i * 2),
            )
            session.add(repair)

        await session.commit()
        print("✅ Database seeded successfully!")
        print(f"   - Added 5 schools with data")
        print(f"   - Added 120 weekly reports (8 per school per category)")
        print(f"   - Added 5 work orders")
        print(f"   - Added 3 repairs")


if __name__ == "__main__":
    asyncio.run(seed_database())
