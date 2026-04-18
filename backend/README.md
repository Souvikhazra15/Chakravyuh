# SchoolAI Backend API

AI-Powered Predictive Maintenance System for Government Schools

## Overview

This FastAPI backend provides predictive maintenance analytics for school infrastructure with focus on:
- Weekly condition reporting (plumbing, electrical, structural)
- AI-powered failure prediction (30-60 days advance)
- DEO priority queue system
- Contractor work order management
- Repair history & learning

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- pip
- PostgreSQL 12+ (optional, API works without it)

### Installation

1. **Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Run:**
```bash
python -m uvicorn app.main:app --reload
```

3. **Access API:**
- http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Using Database (PostgreSQL)

### Option 1: Docker (Easiest)
```bash
docker run -d -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15-alpine
```

### Option 2: Local PostgreSQL Installation
Download from https://www.postgresql.org/download/windows/

### Setup Database Connection

Update `.env`:
```bash
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/schoolai
```

Then restart the API - tables will auto-create on startup.

### Seed Test Data
```bash
python seed.py
```

## API Endpoints

### Reports
- `POST /api/v1/report/` - Submit weekly report
- `GET /api/v1/report/{school_id}` - Get school reports

### Risk Analysis
- `GET /api/v1/risk/{school_id}` - Get risk for all categories
- `GET /api/v1/risk/{school_id}/{category}` - Get risk for one category

### Predictions
- `GET /api/v1/prediction/{school_id}` - Get predictions for all categories
- `GET /api/v1/prediction/{school_id}/{category}` - Get prediction for one category

### Explainability
- `GET /api/v1/explain/{school_id}` - Explain all predictions
- `GET /api/v1/explain/{school_id}/{category}` - Explain one prediction

### DEO Queue (Main Feature)
- `GET /api/v1/deo/queue` - Get global priority queue
- `GET /api/v1/deo/queue/{school_id}` - Get school priority queue

### Work Orders
- `POST /api/v1/work/order` - Create work order
- `POST /api/v1/work/complete` - Mark work complete
- `GET /api/v1/work/order/{work_id}` - Get work order details
- `GET /api/v1/work/school/{school_id}` - Get school work orders
- `GET /api/v1/work/pending` - Get all pending orders

### History & Stats
- `GET /api/v1/history/{school_id}` - Get repair history
- `GET /api/v1/history/` - Get system stats

## Example Requests

### 1. Submit Weekly Report
```bash
curl -X POST http://localhost:8000/api/v1/report/ \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": 101,
    "category": "plumbing",
    "condition": "Major",
    "photo_url": "https://example.com/photo.jpg"
  }'
```

### 2. Get Risk Assessment
```bash
curl http://localhost:8000/api/v1/risk/101
```

### 3. Get Prediction
```bash
curl http://localhost:8000/api/v1/prediction/101/plumbing
```

### 4. Get DEO Priority Queue
```bash
curl http://localhost:8000/api/v1/deo/queue
```

### 5. Create Work Order
```bash
curl -X POST http://localhost:8000/api/v1/work/order \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": 101,
    "category": "plumbing",
    "assigned_to": "John Contractor"
  }'
```

### 6. Complete Work
```bash
curl -X POST http://localhost:8000/api/v1/work/complete \
  -H "Content-Type: application/json" \
  -d '{
    "work_id": 1,
    "photo_url": "https://example.com/completion.jpg",
    "gps_location": "20.5937,78.9629",
    "notes": "Pipe replacement complete"
  }'
```

## Database Schema

### reports
- id (PK)
- school_id (indexed)
- category (plumbing, electrical, structural)
- condition (Good, Minor, Major)
- condition_score (0, 1, 3)
- photo_url
- timestamp

### work_orders
- id (PK)
- school_id (indexed)
- category
- assigned_to
- status (pending, completed)
- created_at
- completed_at

### repairs
- id (PK)
- work_order_id (FK)
- school_id (indexed)
- category
- photo_url
- gps_location
- notes
- completed_at

## Architecture

```
app/
├── main.py              # FastAPI app setup
├── database.py          # SQLAlchemy config
├── models.py            # ORM models
├── schemas.py           # Pydantic schemas
├── utils.py             # Business logic
└── routers/
    ├── report.py        # Report endpoints
    ├── risk.py          # Risk analysis
    ├── prediction.py    # Predictions
    ├── explain.py       # Explainability
    ├── deo.py           # DEO queue
    ├── work.py          # Work orders
    └── history.py       # History & stats
```

## AI Logic

### Risk Scoring
- Takes last 4 reports per category
- Calculates rolling average of condition_score
- Detects trends (worsening/stable/improving)

### Failure Prediction
- Risk >= 2.0 → 30 days
- Risk >= 1.2 → 45 days
- Risk >= 0.8 → 60 days
- Risk < 0.8 → Safe

### Priority Calculation
- Priority = risk_score × impact_weight
- Impact weights:
  - Girls toilet: 5.0
  - Boys toilet: 4.5
  - Classroom: 4.0
  - Lab: 3.5
  - Library/Canteen: 3.0
  - Office: 2.5
  - Storage/Other: 2.0

## Environment Variables

```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/schoolai
ENVIRONMENT=development
DEBUG=True
```

## Development

### Add New Endpoint
1. Create route in appropriate router file
2. Add schema in schemas.py if needed
3. Add utility function in utils.py if needed
4. Test at http://localhost:8000/docs

### Database Changes
1. Modify models.py
2. Restart app (tables auto-create on init_db)

## Testing

Use the interactive API docs:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

Or run test script:
```bash
python api_test.py
```

## Troubleshooting

### Database connection issues
- Ensure PostgreSQL is running on port 5432
- Update DATABASE_URL in .env
- Restart the API

### Import errors
- Make sure you're in virtual environment: `source venv/bin/activate`
- Install requirements: `pip install -r requirements.txt`

### Port already in use
```bash
# Find process on port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

## Performance Notes

- Database query optimization with indexes
- Connection pooling for database
- Async endpoints for high concurrency
- Efficient trend calculation
- Scalable architecture

## License

MIT

## API Endpoints

### Reports
- `POST /api/v1/report/` - Submit weekly report
- `GET /api/v1/report/{school_id}` - Get school reports

### Risk Analysis
- `GET /api/v1/risk/{school_id}` - Get risk for all categories
- `GET /api/v1/risk/{school_id}/{category}` - Get risk for one category

### Predictions
- `GET /api/v1/prediction/{school_id}` - Get predictions for all categories
- `GET /api/v1/prediction/{school_id}/{category}` - Get prediction for one category

### Explainability
- `GET /api/v1/explain/{school_id}` - Explain all predictions
- `GET /api/v1/explain/{school_id}/{category}` - Explain one prediction

### DEO Queue (Main Feature)
- `GET /api/v1/deo/queue` - Get global priority queue
- `GET /api/v1/deo/queue/{school_id}` - Get school priority queue

### Work Orders
- `POST /api/v1/work/order` - Create work order
- `POST /api/v1/work/complete` - Mark work complete
- `GET /api/v1/work/order/{work_id}` - Get work order details
- `GET /api/v1/work/school/{school_id}` - Get school work orders
- `GET /api/v1/work/pending` - Get all pending orders

### History & Stats
- `GET /api/v1/history/{school_id}` - Get repair history
- `GET /api/v1/history/` - Get system stats

## Example Requests

### 1. Submit Weekly Report
```bash
curl -X POST http://localhost:8000/api/v1/report/ \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": 101,
    "category": "plumbing",
    "condition": "Major",
    "photo_url": "https://example.com/photo.jpg"
  }'
```

### 2. Get Risk Assessment
```bash
curl http://localhost:8000/api/v1/risk/101
```

### 3. Get Prediction
```bash
curl http://localhost:8000/api/v1/prediction/101/plumbing
```

### 4. Get DEO Priority Queue
```bash
curl http://localhost:8000/api/v1/deo/queue
```

### 5. Create Work Order
```bash
curl -X POST http://localhost:8000/api/v1/work/order \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": 101,
    "category": "plumbing",
    "assigned_to": "John Contractor"
  }'
```

### 6. Complete Work
```bash
curl -X POST http://localhost:8000/api/v1/work/complete \
  -H "Content-Type: application/json" \
  -d '{
    "work_id": 1,
    "photo_url": "https://example.com/completion.jpg",
    "gps_location": "20.5937,78.9629",
    "notes": "Pipe replacement complete"
  }'
```

## Database Schema

### reports
- id (PK)
- school_id (indexed)
- category (plumbing, electrical, structural)
- condition (Good, Minor, Major)
- condition_score (0, 1, 3)
- photo_url
- timestamp

### work_orders
- id (PK)
- school_id (indexed)
- category
- assigned_to
- status (pending, completed)
- created_at
- completed_at

### repairs
- id (PK)
- work_order_id (FK)
- school_id (indexed)
- category
- photo_url
- gps_location
- notes
- completed_at

## Architecture

```
app/
├── main.py              # FastAPI app setup
├── database.py          # SQLAlchemy config
├── models.py            # ORM models
├── schemas.py           # Pydantic schemas
├── utils.py             # Business logic
└── routers/
    ├── report.py        # Report endpoints
    ├── risk.py          # Risk analysis
    ├── prediction.py    # Predictions
    ├── explain.py       # Explainability
    ├── deo.py           # DEO queue
    ├── work.py          # Work orders
    └── history.py       # History & stats
```

## AI Logic

### Risk Scoring
- Takes last 4 reports per category
- Calculates rolling average of condition_score
- Detects trends (worsening/stable/improving)

### Failure Prediction
- Risk >= 2.0 → 30 days
- Risk >= 1.2 → 45 days
- Risk >= 0.8 → 60 days
- Risk < 0.8 → Safe

### Priority Calculation
- Priority = risk_score × impact_weight
- Impact weights:
  - Girls toilet: 5.0
  - Boys toilet: 4.5
  - Classroom: 4.0
  - Lab: 3.5
  - Library/Canteen: 3.0
  - Office: 2.5
  - Storage/Other: 2.0

## Environment Variables

```
DATABASE_URL=postgresql+asyncpg://user:password@localhost/schoolai
ENVIRONMENT=development
DEBUG=True
```

## Performance Notes

- Async endpoints for high concurrency
- Connection pooling for database
- Indexed queries for fast lookups
- DEO queue sorts by priority_score (DESC)

## Development

### Add New Endpoint
1. Create route in appropriate router file
2. Add schema in schemas.py if needed
3. Add utility function in utils.py if needed
4. Test at http://localhost:8000/docs

### Database Changes
1. Modify models.py
2. Restart app (tables auto-create on init_db)

## Production Deployment

1. Set `ENVIRONMENT=production` in `.env`
2. Use production database URL
3. Run: `gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker`
4. Or use Docker: `docker-compose -f docker-compose.prod.yml up`

## License

MIT
