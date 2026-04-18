"""
Sample data loader for testing the ML pipeline.
Creates mock reports to test the complete flow.
"""

import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models import Report
import random


async def load_sample_data():
    """Load sample data into the database."""
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if data already exists
        result = await session.execute(select(Report))
        existing = result.scalars().first()

        if existing:
            print("Sample data already loaded. Skipping...")
            return

        # Create sample reports for multiple schools and categories
        schools = [101, 102, 103, 104, 105]
        categories = ["girls_toilet", "boys_toilet", "classroom", "lab", "electrical"]
        conditions = ["good", "minor", "major"]

        reports = []
        base_date = datetime.utcnow() - timedelta(days=30)

        for school_id in schools:
            for category in categories:
                # Create 5-8 reports per school-category combination
                num_reports = random.randint(5, 8)

                for i in range(num_reports):
                    # Create a trend: worsening over time
                    if i < num_reports // 2:
                        condition = random.choice(["good", "minor"])
                    else:
                        condition = random.choice(["minor", "major"])

                    condition_score = {
                        "good": random.uniform(0.0, 0.5),
                        "minor": random.uniform(0.5, 2.0),
                        "major": random.uniform(2.0, 3.0),
                    }[condition]

                    report = Report(
                        school_id=school_id,
                        category=category,
                        condition=condition,
                        condition_score=condition_score,
                        timestamp=base_date + timedelta(days=i * 4),
                    )
                    reports.append(report)

        session.add_all(reports)
        await session.commit()

        print(f"✅ Loaded {len(reports)} sample reports")
        print(f"   Schools: {schools}")
        print(f"   Categories: {categories}")


if __name__ == "__main__":
    asyncio.run(load_sample_data())
