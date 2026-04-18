from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Report
from ..schemas import ReportCreate, ReportResponse
from ..utils import condition_to_score

router = APIRouter(prefix="/api/v1/report", tags=["reports"])


@router.post("/", response_model=ReportResponse)
async def submit_report(
    report_data: ReportCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a weekly condition report for a school.
    
    - **school_id**: ID of the school
    - **category**: Category (plumbing, electrical, structural)
    - **condition**: Condition level (Good, Minor, Major)
    - **photo_url**: Optional photo URL
    """
    condition_score = condition_to_score(report_data.condition)

    db_report = Report(
        school_id=report_data.school_id,
        category=report_data.category.lower(),
        condition=report_data.condition.lower(),
        condition_score=condition_score,
        photo_url=report_data.photo_url,
    )

    db.add(db_report)
    await db.commit()
    await db.refresh(db_report)

    return db_report


@router.get("/{school_id}", response_model=list[ReportResponse])
async def get_school_reports(
    school_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get all reports for a specific school."""
    result = await db.execute(
        select(Report).where(Report.school_id == school_id).order_by(Report.timestamp.desc())
    )
    reports = result.scalars().all()

    if not reports:
        raise HTTPException(status_code=404, detail="No reports found for this school")

    return reports
