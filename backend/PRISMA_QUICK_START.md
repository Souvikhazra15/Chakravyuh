╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║          PRISMA + POSTGRESQL SETUP - QUICK START (15 MINUTES)                ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝


✅ WHAT'S READY
═══════════════════════════════════════════════════════════════════════════════

Files Created:
  ✓ prisma/schema.prisma (Database schema)
  ✓ .env (Database configuration)
  ✓ package.json (Node.js dependencies)
  ✓ PRISMA_SETUP.md (Full setup guide)
  ✓ PRISMA_MIGRATION_GUIDE.md (Router migration patterns)

Files Updated:
  ✓ requirements.txt (Added prisma==0.12.0)
  ✓ app/database.py (Prisma connection)
  ✓ app/routers/report.py (Migrated to Prisma)
  ✓ app/routers/deo.py (Migrated to Prisma)


🚀 QUICK START (4 STEPS)
═══════════════════════════════════════════════════════════════════════════════

STEP 1: Setup PostgreSQL (5 minutes)
────────────────────────────────────────────────────────────────────────────────

Option A: Using Docker (Recommended)
  $ docker run -d \
      --name schoolai-postgres \
      -e POSTGRES_DB=schoolai \
      -e POSTGRES_USER=schoolai \
      -e POSTGRES_PASSWORD=secure-password \
      -p 5432:5432 \
      postgres:15

  Wait 5 seconds for startup, then test:
  $ docker ps | grep schoolai-postgres

Option B: Using PostgreSQL locally
  1. Download: https://www.postgresql.org/download/
  2. Install with default settings
  3. Run pgAdmin or psql:
     
     psql -U postgres
     
     CREATE USER schoolai WITH PASSWORD 'secure-password';
     CREATE DATABASE schoolai OWNER schoolai;
     \q

Option C: Using Cloud Database
  - Heroku Postgres
  - AWS RDS PostgreSQL
  - Railway.app
  - Supabase
  - (Just update DATABASE_URL in .env)


STEP 2: Update Configuration (1 minute)
────────────────────────────────────────────────────────────────────────────────

Edit d:\chakravyu\backend\.env:

DATABASE_URL=postgresql://schoolai:secure-password@localhost:5432/schoolai

Change:
  - schoolai = your database user
  - secure-password = your password
  - localhost:5432 = your PostgreSQL host


STEP 3: Install & Migrate (7 minutes)
────────────────────────────────────────────────────────────────────────────────

Open terminal in d:\chakravyu\backend and run:

# Install Node.js packages (if not already done)
$ npm install

# Generate Prisma Client
$ npx prisma generate

# Create database schema
$ npx prisma migrate dev --name init

Expected output:
  ✔ Generated Prisma Client
  ✔ Your database is now in sync with your schema
  ✔ Run npx prisma studio to browse your data

# Install Python dependencies
$ pip install -r requirements.txt


STEP 4: Start Backend (1 minute)
────────────────────────────────────────────────────────────────────────────────

$ python -m uvicorn app.main:app --reload

Expected output:
  ✅ Prisma connected to PostgreSQL
  INFO: Uvicorn running on http://127.0.0.1:8000
  INFO: Application startup complete


✨ YOU'RE DONE! (10-15 minutes)
═══════════════════════════════════════════════════════════════════════════════

Test it:
  $ curl http://localhost:8000/api/v1/deo/queue | python -m json.tool

View database:
  $ npx prisma studio

API docs:
  Open http://localhost:8000/docs in browser


⚙️ DATABASE CONFIGURATION
═══════════════════════════════════════════════════════════════════════════════

Current .env:
  DATABASE_URL=postgresql://schoolai:secure-password@localhost:5432/schoolai

Other Cloud Providers:

Heroku PostgreSQL:
  DATABASE_URL=postgresql://user:password@heroku-host:5432/database

Railway:
  DATABASE_URL=postgresql://user:password@railway-host:5432/database

AWS RDS:
  DATABASE_URL=postgresql://user:password@rds-host:5432/database

Supabase:
  DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

Important: Never commit .env to Git!


📊 VERIFY DATABASE
═══════════════════════════════════════════════════════════════════════════════

View all tables:
  $ npx prisma studio

View schema:
  $ cat prisma/schema.prisma

Check migrations:
  $ npx prisma migrate status

Query database:
  $ npx prisma db execute --stdin
    SELECT count(*) FROM reports;


📚 NEXT STEPS
═══════════════════════════════════════════════════════════════════════════════

1. Load Sample Data (Optional)
   $ python load_sample_data.py

2. Run Tests
   $ python test_api.py

3. Migrate Remaining Routers
   See PRISMA_MIGRATION_GUIDE.md for:
   - work.py
   - prediction.py
   - risk.py
   - explain.py
   - history.py
   - pipeline.py

4. Customize Schema
   Edit prisma/schema.prisma
   Run: npx prisma migrate dev --name description


🔧 USEFUL COMMANDS
═══════════════════════════════════════════════════════════════════════════════

View database UI:
  npx prisma studio

Reset database (⚠️ DELETES ALL DATA):
  npx prisma migrate reset

Create new migration:
  npx prisma migrate dev --name add_field

Apply migrations:
  npx prisma migrate deploy

Check migration status:
  npx prisma migrate status

Format schema:
  npx prisma format

Validate schema:
  npx prisma validate

Generate client:
  npx prisma generate


🐛 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

Problem: "Error: connect ECONNREFUSED 127.0.0.1:5432"
  → PostgreSQL not running
  → Solution: Start PostgreSQL service or Docker container

Problem: "FATAL: database 'schoolai' does not exist"
  → Database not created
  → Solution: Run: CREATE DATABASE schoolai;

Problem: "FATAL: role 'schoolai' does not exist"
  → User not created
  → Solution: Run: CREATE USER schoolai WITH PASSWORD 'password';

Problem: "Prisma Client is not yet generated"
  → Solution: npx prisma generate

Problem: "SSL connection error"
  → Solution: Add ?sslmode=disable to DATABASE_URL temporarily

Problem: Migrations fail
  → Check DATABASE_URL is correct
  → Check database is running and accessible


🎯 CURRENT STATUS
═══════════════════════════════════════════════════════════════════════════════

Prisma Setup: ✅ Complete
  - Schema created
  - Configuration ready
  - Python client configured

Partial Migration: ✅ In Progress
  - report.py migrated
  - deo.py migrated
  - Other routers need migration (see PRISMA_MIGRATION_GUIDE.md)

Backend: ⚠️ Partially Working
  - /api/v1/report endpoints work
  - /api/v1/deo endpoints work
  - Other endpoints use SQLAlchemy (legacy)

Next: Complete router migration for 100% Prisma


📋 FILE LOCATIONS
═══════════════════════════════════════════════════════════════════════════════

Configuration:
  - d:\chakravyu\backend\.env
  - d:\chakravyu\backend\prisma\schema.prisma

Setup Guides:
  - d:\chakravyu\backend\PRISMA_SETUP.md
  - d:\chakravyu\backend\PRISMA_MIGRATION_GUIDE.md
  - d:\chakravyu\backend\PRISMA_QUICK_START.md (this file)

Backend Code:
  - d:\chakravyu\backend\app\database.py (connection)
  - d:\chakravyu\backend\app\routers\report.py (migrated)
  - d:\chakravyu\backend\app\routers\deo.py (migrated)
  - d:\chakravyu\backend\app\routers\work.py (TODO)
  - d:\chakravyu\backend\app\routers\prediction.py (TODO)
  - etc.

Dependencies:
  - d:\chakravyu\backend\requirements.txt (updated)
  - d:\chakravyu\backend\package.json (new)


═══════════════════════════════════════════════════════════════════════════════

Ready to start? Follow STEP 1 above! 🚀

═══════════════════════════════════════════════════════════════════════════════
