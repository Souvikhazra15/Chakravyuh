╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║              PRISMA ORM + POSTGRESQL MIGRATION GUIDE                          ║
║                                                                               ║
║         Complete Setup for SchoolAI Backend with Prisma Database             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝


📋 MIGRATION OVERVIEW
═══════════════════════════════════════════════════════════════════════════════

Before: SQLAlchemy + SQLite/PostgreSQL
After:  Prisma ORM + PostgreSQL

Benefits:
  ✅ Type-safe database operations
  ✅ Prisma Studio visual database explorer
  ✅ Automatic migrations with rollback support
  ✅ Better performance with connection pooling
  ✅ Zero-dependency Python client
  ✅ Migration history tracking


🔧 PREREQUISITES
═══════════════════════════════════════════════════════════════════════════════

1. PostgreSQL Server
   - Install: https://www.postgresql.org/download/
   - Or use Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

2. Node.js (for Prisma CLI)
   - Install: https://nodejs.org/ (v18+)
   - Check: node --version

3. Python 3.8+
   - Already have it ✅


⚙️ STEP-BY-STEP SETUP
═══════════════════════════════════════════════════════════════════════════════

STEP 1: Configure PostgreSQL
────────────────────────────────────────────────────────────────────────────────

On Windows (psql command line):
  psql -U postgres

Then:
  CREATE USER schoolai WITH PASSWORD 'your-secure-password';
  CREATE DATABASE schoolai OWNER schoolai;
  \q

Or use Docker:
  docker run -d \
    --name schoolai-postgres \
    -e POSTGRES_DB=schoolai \
    -e POSTGRES_USER=schoolai \
    -e POSTGRES_PASSWORD=your-secure-password \
    -p 5432:5432 \
    postgres:15


STEP 2: Update .env File
────────────────────────────────────────────────────────────────────────────────

Edit d:\chakravyu\backend\.env:

  DATABASE_URL=postgresql://schoolai:your-secure-password@localhost:5432/schoolai
  SECRET_KEY=dev-secret-key-change-in-production
  ENVIRONMENT=development
  DEBUG=True

Replace:
  - schoolai = your PostgreSQL user
  - your-secure-password = your actual password
  - localhost:5432 = your PostgreSQL connection


STEP 3: Install Node.js Dependencies
────────────────────────────────────────────────────────────────────────────────

$ cd d:\chakravyu\backend
$ npm install

This installs Prisma CLI.


STEP 4: Generate Prisma Client
────────────────────────────────────────────────────────────────────────────────

$ npx prisma generate

Expected output:
  ✔ Generated Prisma Client (v5.x.x) to ./prisma/client


STEP 5: Run Initial Migration
────────────────────────────────────────────────────────────────────────────────

$ npx prisma migrate dev --name init

This:
  ✓ Creates database schema from schema.prisma
  ✓ Creates migration file
  ✓ Applies migration to database
  ✓ Generates Prisma client

Expected output:
  ✔ Successfully created migrations/20240101120000_init


STEP 6: Install Python Dependencies
────────────────────────────────────────────────────────────────────────────────

$ pip install -r requirements.txt

Key packages:
  - prisma==0.12.0       (Python ORM client)
  - fastapi==0.104.1
  - pydantic==2.5.0
  - psycopg2-binary      (PostgreSQL driver)


STEP 7: Load Sample Data (Optional)
────────────────────────────────────────────────────────────────────────────────

$ python load_sample_data.py

This creates test data for development/testing.


STEP 8: Start Backend
────────────────────────────────────────────────────────────────────────────────

$ python -m uvicorn app.main:app --reload

Expected output:
  ✅ Prisma connected to PostgreSQL
  INFO: Uvicorn running on http://127.0.0.1:8000
  INFO: Application startup complete


🎯 VERIFY SETUP
═══════════════════════════════════════════════════════════════════════════════

✓ Test API:
  curl http://localhost:8000/api/v1/deo/queue | python -m json.tool

✓ View Database (Prisma Studio):
  npx prisma studio

✓ Check Migrations:
  npx prisma migrate status

✓ View Schema:
  cat prisma/schema.prisma


📊 USING PRISMA IN CODE
═══════════════════════════════════════════════════════════════════════════════

Basic Query Examples:

from prisma import Prisma

db = Prisma()
await db.connect()

# Create
report = await db.report.create(
    data={
        "school_id": 101,
        "category": "girls_toilet",
        "condition": "major",
        "condition_score": 2.5,
    }
)

# Read
reports = await db.report.find_many(
    where={"school_id": 101},
    order_by={"timestamp": "desc"},
)

# Update
updated = await db.report.update(
    where={"id": 1},
    data={"condition": "resolved"}
)

# Delete
await db.report.delete(where={"id": 1})

# Raw SQL
result = await db.query_raw("SELECT * FROM reports WHERE school_id = $1", [101])


🔄 COMMON COMMANDS
═══════════════════════════════════════════════════════════════════════════════

# View database
npx prisma studio

# Create migration
npx prisma migrate dev --name add_new_field

# Apply migrations
npx prisma migrate deploy

# Reset database (DELETE ALL DATA!)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Generate Prisma client
npx prisma generate

# Format schema
npx prisma format

# Validate schema
npx prisma validate


📁 PROJECT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

d:\chakravyu\backend\
├── prisma/
│   ├── schema.prisma           ← Database schema
│   ├── migrations/             ← Migration history
│   │   └── 20240101120000_init/
│   │       └── migration.sql
│   └── .gitignore
├── app/
│   ├── database.py             ← Prisma connection (updated)
│   ├── models.py               ← (Can be removed - Prisma generates types)
│   ├── main.py                 ← FastAPI app
│   └── routers/
│       ├── deo.py
│       ├── pipeline.py
│       └── ...
├── .env                        ← PostgreSQL connection
├── requirements.txt            ← Updated with Prisma
├── package.json                ← Node.js/Prisma CLI
└── load_sample_data.py         ← Data seeding


🐛 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

Problem: "Prisma Client is not yet generated"
Solution: npx prisma generate

Problem: "Connection refused (127.0.0.1:5432)"
Solution: Ensure PostgreSQL is running:
  # Windows
  pg_isready -h localhost -p 5432
  
  # Or start PostgreSQL service

Problem: "Database 'schoolai' does not exist"
Solution: Create database (see STEP 1 above)

Problem: "role 'schoolai' does not exist"
Solution: Create user (see STEP 1 above)

Problem: "SSL connection error"
Solution: Add ?sslmode=disable to DATABASE_URL temporarily:
  postgresql://user:pass@localhost:5432/schoolai?sslmode=disable

Problem: Migrations fail
Solution: Check .env DATABASE_URL is correct
  DATABASE_URL=postgresql://user:password@localhost:5432/database


🔒 SECURITY NOTES
═══════════════════════════════════════════════════════════════════════════════

✓ Store passwords in .env (not in code)
✓ Use strong PostgreSQL passwords in production
✓ Enable SSL/TLS for production connections
✓ Never commit .env to version control
✓ Rotate database credentials regularly
✓ Use database role with minimal permissions


📈 PERFORMANCE TIPS
═══════════════════════════════════════════════════════════════════════════════

1. Indexes (already set in schema.prisma)
   - school_id ✅
   - category ✅
   - timestamp ✅

2. Connection pooling
   - Set PRISMA_CLIENT_POOL_SIZE=10

3. Query optimization
   - Use select to fetch only needed fields
   - Use findMany with pagination

4. Connection pooling proxy (production)
   - Use PgBouncer or Supabase pooling


🚀 DEPLOYMENT
═══════════════════════════════════════════════════════════════════════════════

Production Setup:

1. Install dependencies
   pip install -r requirements.txt

2. Generate Prisma client
   npx prisma generate

3. Run migrations
   npx prisma migrate deploy

4. Start with Gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app

5. Or with Docker
   See DEPLOYMENT.md for Docker setup


📚 ADDITIONAL RESOURCES
═══════════════════════════════════════════════════════════════════════════════

- Prisma Docs: https://www.prisma.io/docs/
- Prisma Python: https://github.com/prisma/prisma-client-py
- PostgreSQL Docs: https://www.postgresql.org/docs/
- FastAPI + Prisma: https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases-python


═══════════════════════════════════════════════════════════════════════════════

✅ SETUP COMPLETE!

Your SchoolAI backend is now using:
  • Prisma ORM for type-safe database access
  • PostgreSQL for reliable data storage
  • Automatic migrations for schema changes
  • FastAPI for high-performance APIs

Next steps:
  1. Configure PostgreSQL
  2. Update .env with connection string
  3. Run: npm install && npx prisma migrate dev
  4. Run: python -m uvicorn app.main:app --reload
  5. Visit: http://localhost:8000/docs

═══════════════════════════════════════════════════════════════════════════════
