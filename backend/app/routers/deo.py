from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..database import get_db
from ..models import Report
from ..schemas import DEOQueueItem
from ..utils import (
    calculate_risk_score,
    calculate_trend,
    predict_failure,
    generate_prediction_reason,
    calculate_priority_score,
    get_last_n_reports,
)

router = APIRouter(prefix="/api/v1/deo", tags=["deo"])


@router.get("/queue", response_model=list[DEOQueueItem])
async def get_priority_queue(
    db: AsyncSession = Depends(get_db),
):
    """
    Get prioritized maintenance queue for District Education Officer.
    
    Returns schools sorted by priority score (risk_score * impact_weight).
    Priority weights: girls_toilet=5, classroom=4, others=2
    """
    result = await db.execute(
        select(func.distinct(Report.school_id, Report.category))
        .select_from(Report)
        .order_by(Report.school_id, Report.category, Report.timestamp.desc())
    )

    result = await db.execute(select(Report))
    all_reports = result.scalars().all()

    school_categories = {}
    for report in all_reports:
        key = (report.school_id, report.category)
        if key not in school_categories:
            school_categories[key] = []
        school_categories[key].append(report)

    queue_items = []

    for (school_id, category), reports in school_categories.items():
        sorted_reports = sorted(reports, key=lambda x: x.timestamp, reverse=True)
        scores = get_last_n_reports(sorted_reports, 4)

        if not scores:
            continue

        risk_score = calculate_risk_score(scores)
        trend = calculate_trend(scores)
        prediction, days = predict_failure(risk_score)
        reason = generate_prediction_reason(risk_score, trend, scores)
        priority_score = calculate_priority_score(risk_score, category)

        if prediction != "Safe":
            queue_items.append(
                DEOQueueItem(
                    school_id=school_id,
                    category=category,
                    prediction=prediction,
                    reason=reason,
                    priority_score=priority_score,
                    risk_score=risk_score,
                    days_until_failure=days,
                )
            )

    queue_items.sort(key=lambda x: x.priority_score, reverse=True)

    return queue_items


@router.get("/queue/{school_id}", response_model=list[DEOQueueItem])
async def get_priority_queue_for_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get priority queue filtered for a specific school."""
    result = await db.execute(
        select(Report).where(Report.school_id == school_id).order_by(Report.timestamp.desc())
    )
    all_reports = result.scalars().all()

    school_categories = {}
    for report in all_reports:
        key = report.category
        if key not in school_categories:
            school_categories[key] = []
        school_categories[key].append(report)

    queue_items = []

    for category, reports in school_categories.items():
        sorted_reports = sorted(reports, key=lambda x: x.timestamp, reverse=True)
        scores = get_last_n_reports(sorted_reports, 4)

        if not scores:
            continue

        risk_score = calculate_risk_score(scores)
        trend = calculate_trend(scores)
        prediction, days = predict_failure(risk_score)
        reason = generate_prediction_reason(risk_score, trend, scores)
        priority_score = calculate_priority_score(risk_score, category)

        if prediction != "Safe":
            queue_items.append(
                DEOQueueItem(
                    school_id=school_id,
                    category=category,
                    prediction=prediction,
                    reason=reason,
                    priority_score=priority_score,
                    risk_score=risk_score,
                    days_until_failure=days,
                )
            )

    queue_items.sort(key=lambda x: x.priority_score, reverse=True)

    return queue_items
