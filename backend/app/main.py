from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from .database import init_db, close_db
from .routers import report, risk, prediction, explain, deo, work, history, pipeline, auth, school, principal, analyze, peon, chat

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting SchoolAI Backend...")
    try:
        await init_db()
        print("✅ Database initialized and connected")
    except Exception as e:
        print(f"⚠️  Database initialization error: {str(e)}")
        print("   Configure DATABASE_URL in .env and restart to enable database")
        raise
    yield
    print("🛑 Shutting down SchoolAI Backend...")
    try:
        await close_db()
    except Exception as e:
        print(f"⚠️  Error during shutdown: {e}")


app = FastAPI(
    title="SchoolAI API",
    description="AI-Powered Predictive Maintenance System for Government Schools",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware - Must be first/outermost
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    max_age=3600,
)

app.include_router(report.router)
app.include_router(risk.router)
app.include_router(prediction.router)
app.include_router(explain.router)
app.include_router(deo.router)
app.include_router(work.router)
app.include_router(work.work_orders_router)
app.include_router(work.assign_router)
app.include_router(history.router)
app.include_router(pipeline.router)
app.include_router(auth.router)
app.include_router(school.router)
app.include_router(principal.router)
app.include_router(analyze.router)
app.include_router(peon.router)
app.include_router(chat.router)


@app.get("/", tags=["health"])
async def root():
    """Health check and API info."""
    return {
        "message": "ShalaRakshak API is running",
        "environment": ENVIRONMENT,
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "service": "SchoolAI Backend",
        "environment": ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=ENVIRONMENT == "development",
    )
