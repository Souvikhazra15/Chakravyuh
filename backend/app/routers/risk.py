from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Report
from ..schemas import RiskData
from ..utils import calculate_risk_score, calculate_trend, get_last_n_reports

router = APIRouter(prefix="/api/v1/risk", tags=["risk"])


@router.get("/{school_id}", response_model=list[RiskData])
async def get_risk_for_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get risk assessment for all categories of a school.
    
    Risk calculation based on last 4 reports per category.
    """
    categories = ["plumbing", "electrical", "structural"]
    risk_data = []

    for category in categories:
        result = await db.execute(
            select(Report)
            .where(Report.school_id == school_id, Report.category == category)
            .order_by(Report.timestamp.desc())
            .limit(4)
        )
        reports = result.scalars().all()

        if not reports:
            risk_data.append(
                RiskData(
                    category=category,
                    risk_score=0.0,
                    trend="no_data",
                    last_scores=[],
                )
            )
            continue

        scores = get_last_n_reports(reports, 4)
        risk_score = calculate_risk_score(scores)
        trend = calculate_trend(scores)

        risk_data.append(
            RiskData(
                category=category,
                risk_score=risk_score,
                trend=trend,
                last_scores=scores,
            )
        )

    return risk_data


@router.get("/{school_id}/{category}", response_model=RiskData)
async def get_risk_for_category(
    school_id: int,
    category: str,
    db: AsyncSession = Depends(get_db),
):
    """Get risk assessment for a specific category."""
    result = await db.execute(
        select(Report)
        .where(Report.school_id == school_id, Report.category == category.lower())
        .order_by(Report.timestamp.desc())
        .limit(4)
    )
    reports = result.scalars().all()

    if not reports:
        return RiskData(
            category=category,
            risk_score=0.0,
            trend="no_data",
            last_scores=[],
        )

    scores = get_last_n_reports(reports, 4)
    risk_score = calculate_risk_score(scores)
    trend = calculate_trend(scores)

    return RiskData(
        category=category,
        risk_score=risk_score,
        trend=trend,
        last_scores=scores,
    )
