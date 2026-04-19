from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..schemas import ReportCreate, ReportResponse
from ..utils import condition_to_score

router = APIRouter(prefix="/api/v1/report", tags=["reports"])


@router.post("/", response_model=ReportResponse)
async def submit_report(
    report_data: ReportCreate,
    db = Depends(get_db),
):
    """
    Submit a weekly condition report for a school.
    
    - **school_id**: ID of the school
    - **category**: Category (girls_toilet, boys_toilet, classroom, etc.)
    - **condition**: Condition level (good, minor, major)
    - **photo_url**: Optional photo URL
    """
    condition_score = condition_to_score(report_data.condition)

    # Create report using Prisma
    db_report = await db.report.create(
        data={
            "school_id": report_data.school_id,
            "category": report_data.category.lower(),
            "condition": report_data.condition.lower(),
            "condition_score": condition_score,
            "photo_url": report_data.photo_url,
        }
    )

    return db_report


@router.get("/{school_id}", response_model=list[ReportResponse])
async def get_school_reports(
    school_id: int,
    db = Depends(get_db),
):
    """Get all reports for a specific school."""
    reports = await db.report.find_many(
        where={"school_id": school_id},
        order_by={"timestamp": "desc"},
    )

    if not reports:
        raise HTTPException(status_code=404, detail="No reports found for this school")

    return reports
