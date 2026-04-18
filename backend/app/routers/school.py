from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from ..database import get_db
from ..schemas import RiskData
from ..utils import (
    calculate_risk_score,
    calculate_trend,
    predict_failure,
    generate_prediction_reason,
    calculate_priority_score,
    get_last_n_reports,
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
    days_to_failure: int
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
    
    # For now, return empty list - to be populated from reports and risk data
    # This will be enhanced once we integrate with reports
    issues = []
    
    return issues


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
        categories = ["plumbing", "electrical", "structural", "girls_toilet", "boys_toilet", "classroom"]
        
        issues = []
        
        for category in categories:
            # Get last 4 reports for this category
            reports = await get_last_n_reports(school_id, category, 4, db)
            
            if not reports:
                continue
            
            # Calculate risk score
            risk_score = calculate_risk_score(
                [r.condition_score for r in reports]
            )
            
            # Calculate trend
            trend = calculate_trend(
                [r.condition_score for r in reports]
            )
            
            # Predict failure
            days_to_failure = predict_failure(
                [r.condition_score for r in reports]
            )
            
            # Generate reason
            reason = generate_prediction_reason(risk_score, days_to_failure, trend)
            
            # Calculate priority score (0.0 to 5.0)
            priority_score = calculate_priority_score(risk_score, category, days_to_failure)
            
            # Determine priority level
            if priority_score >= 3.5:
                priority_level = "Critical"
            elif priority_score >= 2.5:
                priority_level = "High"
            elif priority_score >= 1.5:
                priority_level = "Medium"
            else:
                priority_level = "Low"
            
            # Get latest report's condition
            latest_report = reports[0]
            condition_map = {0.0: "Good", 1.0: "Minor Issue", 3.0: "Major Issue"}
            condition = condition_map.get(latest_report.condition_score, "Unknown")
            
            # Get reported date
            reported_date = latest_report.timestamp.isoformat().split('T')[0] if latest_report.timestamp else "Unknown"
            
            issue = IssueResponse(
                id=latest_report.id,
                category=category.title().replace('_', ' '),
                condition=condition,
                risk_score=round(risk_score, 2),
                priority_level=priority_level,
                priority_score=round(priority_score, 2),
                days_to_failure=max(1, int(days_to_failure)),
                reported_date=reported_date,
                status="pending"
            )
            
            issues.append(issue)
        
        # Sort by priority score (highest first)
        issues.sort(key=lambda x: x.priority_score, reverse=True)
        
        return issues
        
    except Exception as e:
        print(f"Error getting school issues: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching issues: {str(e)}"
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
            detail=str(e)
        )


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
