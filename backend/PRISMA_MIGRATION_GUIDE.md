╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║         MIGRATING OTHER ROUTERS FROM SQLALCHEMY TO PRISMA                    ║
║                                                                               ║
║          Step-by-step guide for updating remaining API endpoints             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝


STATUS: PARTIAL MIGRATION COMPLETE
═══════════════════════════════════════════════════════════════════════════════

✅ Already Migrated to Prisma:
  • app/routers/report.py (POST /report, GET /report/{school_id})
  • app/routers/deo.py (GET /deo/queue, GET /deo/queue/{school_id})
  • app/database.py (Connection management)

⏳ Still Need Migration:
  • app/routers/work.py
  • app/routers/prediction.py
  • app/routers/risk.py
  • app/routers/explain.py
  • app/routers/history.py
  • app/routers/pipeline.py


MIGRATION PATTERN
═══════════════════════════════════════════════════════════════════════════════

OLD (SQLAlchemy):
─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Report

@router.get("/{id}")
async def get_report(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == id))
    report = result.scalar_one_or_none()
    return report

@router.post("/")
async def create_report(data: ReportCreate, db: AsyncSession = Depends(get_db)):
    report = Report(school_id=data.school_id, category=data.category)
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


NEW (Prisma):
─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends
from ..database import get_db

@router.get("/{id}")
async def get_report(id: int, db = Depends(get_db)):
    report = await db.report.find_unique(where={"id": id})
    return report

@router.post("/")
async def create_report(data: ReportCreate, db = Depends(get_db)):
    report = await db.report.create(
        data={
            "school_id": data.school_id,
            "category": data.category,
        }
    )
    return report


KEY CHANGES
═══════════════════════════════════════════════════════════════════════════════

1. Remove SQLAlchemy Imports
   ❌ from sqlalchemy.ext.asyncio import AsyncSession
   ❌ from sqlalchemy import select
   ❌ from ..models import Report
   
2. Simplify Database Parameter
   ❌ db: AsyncSession = Depends(get_db)
   ✅ db = Depends(get_db)

3. Replace SQLAlchemy Queries
   ❌ result = await db.execute(select(Report))
   ✅ await db.report.find_many()
   
   ❌ result = await db.execute(select(Report).where(Report.id == id))
   ✅ await db.report.find_unique(where={"id": id})
   
   ❌ await db.execute(select(Report).where(Report.school_id == sid).order_by(Report.timestamp.desc()))
   ✅ await db.report.find_many(where={"school_id": sid}, order_by={"timestamp": "desc"})

4. Replace Create Operations
   ❌ report = Report(school_id=data.school_id)
      db.add(report)
      await db.commit()
      await db.refresh(report)
   
   ✅ report = await db.report.create(data={"school_id": data.school_id})

5. Replace Update Operations
   ❌ report.status = "completed"
      await db.commit()
   
   ✅ report = await db.report.update(
        where={"id": id},
        data={"status": "completed"}
      )

6. Replace Delete Operations
   ❌ await db.delete(report)
      await db.commit()
   
   ✅ await db.report.delete(where={"id": id})


PRISMA QUERY REFERENCE
═══════════════════════════════════════════════════════════════════════════════

Find Single Record:
  await db.report.find_unique(where={"id": 1})
  await db.report.find_first(where={"school_id": 101})

Find Many Records:
  await db.report.find_many()
  await db.report.find_many(where={"school_id": 101})
  await db.report.find_many(order_by={"timestamp": "desc"})
  await db.report.find_many(skip=10, take=20)  # Pagination

Count Records:
  count = await db.report.count(where={"school_id": 101})

Create:
  await db.report.create(
    data={
        "school_id": 101,
        "category": "girls_toilet",
        "condition": "major",
        "condition_score": 2.5,
    }
  )

Update:
  await db.report.update(
    where={"id": 1},
    data={"condition": "resolved"}
  )

Delete:
  await db.report.delete(where={"id": 1})

Upsert (create or update):
  await db.report.upsert(
    where={"id": 1},
    create={"school_id": 101, "category": "girls_toilet"},
    update={"condition": "resolved"}
  )

Raw SQL:
  result = await db.query_raw("SELECT * FROM reports WHERE school_id = $1", [101])


WHERE CONDITIONS
═══════════════════════════════════════════════════════════════════════════════

Equality:
  where={"school_id": 101}

Multiple conditions (AND):
  where={"school_id": 101, "category": "girls_toilet"}

Comparison:
  where={"condition_score": {"gt": 1.5}}    # greater than
  where={"condition_score": {"gte": 1.5}}   # greater than or equal
  where={"condition_score": {"lt": 1.5}}    # less than
  where={"condition_score": {"lte": 1.5}}   # less than or equal
  where={"condition_score": {"not": 1.5}}   # not equal

Text search:
  where={"category": {"contains": "toilet"}}    # case-sensitive
  where={"category": {"search": "toilet"}}      # case-insensitive

IN operator:
  where={"school_id": {"in": [101, 102, 103]}}

OR operator:
  from prisma import Or
  where=Or([
      {"school_id": 101},
      {"school_id": 102},
  ])

Date comparisons:
  where={"timestamp": {"gte": datetime.now()}}


COMMON PATTERNS
═══════════════════════════════════════════════════════════════════════════════

1. Get all records for a school ordered by date
   SQLAlchemy:
     result = await db.execute(
         select(Report)
         .where(Report.school_id == school_id)
         .order_by(Report.timestamp.desc())
     )
     reports = result.scalars().all()

   Prisma:
     reports = await db.report.find_many(
         where={"school_id": school_id},
         order_by={"timestamp": "desc"}
     )

2. Count records by category
   SQLAlchemy:
     from sqlalchemy import func
     result = await db.execute(
         select(Report.category, func.count())
         .group_by(Report.category)
     )

   Prisma:
     # Use groupBy (requires special handling)
     result = await db.report.group_by(
         ["category"],
         _count={"id": True}
     )

3. Get last N reports for each school_id
   SQLAlchemy:
     # Complex subquery logic

   Prisma:
     # Fetch all and process in Python
     reports = await db.report.find_many(
         order_by={"timestamp": "desc"},
         take=N  # Last N
     )

4. Pagination
   SQLAlchemy:
     result = await db.execute(
         select(Report).offset(10).limit(20)
     )

   Prisma:
     reports = await db.report.find_many(
         skip=10,
         take=20
     )


MIGRATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

For each router file (work.py, prediction.py, etc.):

□ Remove SQLAlchemy imports
  - sqlalchemy.ext.asyncio
  - sqlalchemy (select, func, etc.)
  - ..models (all model classes)

□ Update function signatures
  - Remove: AsyncSession type hint
  - Keep: Depends(get_db)

□ Replace all database queries
  - db.execute(select(...)) → db.model.find_many()
  - db.add() → db.model.create()
  - db.commit() → (automatic with Prisma)
  - db.refresh() → (automatic with Prisma)
  - db.delete() → db.model.delete()

□ Test endpoint after migration
  - Run: python test_api.py
  - Or: curl endpoint

□ Update imports (alphabetical order)


TESTING AFTER MIGRATION
═══════════════════════════════════════════════════════════════════════════════

1. Unit test the endpoint
   $ curl http://localhost:8000/api/v1/work/ | python -m json.tool

2. Run test suite
   $ python test_api.py

3. Check error logs
   $ # Watch backend terminal for errors


ROLLBACK IF NEEDED
═══════════════════════════════════════════════════════════════════════════════

If migration causes issues:

1. Revert to SQLAlchemy temporarily
   $ git checkout app/routers/work.py

2. Or fix specific function:
   - Identify failing endpoint
   - Revert that function
   - Try different query syntax


HELP & DEBUGGING
═══════════════════════════════════════════════════════════════════════════════

Common Prisma Errors:

Error: "Model 'Report' not found"
  Fix: Check schema.prisma for model name (might be 'report')

Error: "Field 'id' is not defined"
  Fix: Schema might have different field names

Error: "Cannot use async/await in non-async function"
  Fix: Make route async: async def endpoint(...)

Error: "Prisma Client is not yet generated"
  Fix: Run npx prisma generate

Inspect database:
  $ npx prisma studio


EXAMPLES: WORK.PY MIGRATION
═══════════════════════════════════════════════════════════════════════════════

Before (SQLAlchemy):
───────────────────

@router.post("/", response_model=WorkOrderResponse)
async def create_work_order(
    order_data: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
):
    db_order = WorkOrder(
        school_id=order_data.school_id,
        category=order_data.category,
        assigned_to=order_data.assigned_to,
    )
    db.add(db_order)
    await db.commit()
    await db.refresh(db_order)
    return db_order

After (Prisma):
──────────────

@router.post("/", response_model=WorkOrderResponse)
async def create_work_order(
    order_data: WorkOrderCreate,
    db = Depends(get_db),
):
    db_order = await db.work_order.create(
        data={
            "school_id": order_data.school_id,
            "category": order_data.category,
            "assigned_to": order_data.assigned_to,
        }
    )
    return db_order


NEXT STEPS
═══════════════════════════════════════════════════════════════════════════════

1. Start backend (routes will partially work)
   $ python -m uvicorn app.main:app --reload

2. Migrate remaining routers using patterns above:
   - work.py
   - prediction.py
   - risk.py
   - explain.py
   - history.py
   - pipeline.py

3. Test each endpoint after migration

4. Run full test suite

5. Celebrate Prisma ORM adoption! 🎉


═══════════════════════════════════════════════════════════════════════════════
