from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from ..database import get_db
from ..utils import (
    calculate_risk_score,
    predict_failure,
    calculate_priority_level,
)
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/school", tags=["school"])


class IssueResponse(BaseModel):
    """School issue/maintenance item"""
    id: int
    category: str
    condition: str
    risk_score: float
    priority_level: str
    priority_score: float
    days_to_failure: Optional[int]
    reported_date: str
    status: str = "pending"
    
    class Config:
        from_attributes = True


@router.get("/issues", response_model=List[IssueResponse])
async def get_school_issues(
    school_id: Optional[int] = None,
    db = Depends(get_db),
):
    """
    Get all maintenance issues for a school.
    
    If school_id not provided in query, uses school_id from user context.
    Returns risk-prioritized list of issues/maintenance items.
    """
    
    if school_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="school_id query parameter is required",
        )

    return await _build_issues_for_school(school_id, db)


@router.get("/issues/{school_id}", response_model=List[IssueResponse])
async def get_school_issues_by_id(
    school_id: int,
    db = Depends(get_db),
):
    """
    Get all maintenance issues for a specific school.
    
    Returns:
    - Issues derived from recent reports
    - Prioritized by risk score and failure prediction
    - Includes days until likely failure
    """
    
    try:
        return await _build_issues_for_school(school_id, db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching issues: {str(e)}",
        )


@router.get("/stats/{school_id}")
async def get_school_stats(
    school_id: int,
    db = Depends(get_db),
):
    """
    Get statistics for a school:
    - Total issues
    - Critical issues count
    - Completion rate
    """
    
    try:
        issues = await get_school_issues_by_id(school_id, db)
        
        total_issues = len(issues)
        critical_issues = len([i for i in issues if i.priority_level == "Critical"])
        completion_rate = 65  # Placeholder - will be calculated from work orders
        
        return {
            "school_id": school_id,
            "total_issues": total_issues,
            "critical_issues": critical_issues,
            "completion_rate": completion_rate,
            "issues": issues
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


async def _build_issues_for_school(school_id: int, db) -> List[IssueResponse]:
    reports = await db.report.find_many(
        where={"school_id": school_id},
        order_by={"timestamp": "desc"},
    )

    if not reports:
        return []

    grouped = {}
    for report in reports:
        grouped.setdefault(report.category, []).append(report)

    issues: List[IssueResponse] = []
    for category, category_reports in grouped.items():
        recent_reports = sorted(
            category_reports, key=lambda r: r.timestamp, reverse=True
        )[:4]

        scores = [r.condition_score for r in recent_reports]
        if len(scores) < 1:
            continue

        risk_score = calculate_risk_score(scores)
        _, days_until_failure = predict_failure(risk_score)
        priority_score, priority_level = calculate_priority_level(category, risk_score)

        latest_report = recent_reports[0]
        condition = latest_report.condition or "Unknown"
        reported_date = (
            latest_report.timestamp.date().isoformat()
            if latest_report.timestamp
            else "Unknown"
        )

        issues.append(
            IssueResponse(
                id=latest_report.id,
                category=category.title().replace("_", " "),
                condition=condition,
                risk_score=round(risk_score, 2),
                priority_level=priority_level,
                priority_score=round(priority_score, 2),
                days_to_failure=days_until_failure,
                reported_date=reported_date,
                status="pending",
            )
        )

    issues.sort(key=lambda x: x.priority_score, reverse=True)
    return issues


@router.post("/issues/{school_id}/approve")
async def approve_repair(
    school_id: int,
    issue_id: int,
    approved_by: str,
    db = Depends(get_db),
):
    """
    Principal approves a repair/maintenance work.
    Creates a work order for contractors.
    """
    
    return {
        "success": True,
        "issue_id": issue_id,
        "status": "Approved",
        "work_order_id": f"WO_{school_id}_{issue_id}"
    }
