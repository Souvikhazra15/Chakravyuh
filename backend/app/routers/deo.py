from fastapi import APIRouter, Depends
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..schemas import DEOQueueItem
from ..utils import (
    calculate_risk_score,
    calculate_trend,
    predict_failure,
    generate_prediction_reason,
    calculate_priority_score,
    get_last_n_reports,
    hybrid_anomaly_detection,
    categorize_status,
)

router = APIRouter(prefix="/api/v1/deo", tags=["deo"])


@router.get("/queue", response_model=List[DEOQueueItem])
async def get_priority_queue(db = Depends(get_db)):
    """
    Get prioritized maintenance queue for District Education Officer.
    Combines ML anomaly detection with risk scoring.
    Sorted by priority_score descending (highest priority first).
    """
    # Fetch all reports from Prisma
    all_reports = await db.report.find_many()

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

        if len(scores) < 2:
            continue

        risk_score = calculate_risk_score(scores)
        trend = calculate_trend(scores)

        # Hybrid ML Detection
        anomaly_result = hybrid_anomaly_detection(
            scores=scores, contamination=0.10, z_threshold=2.0
        )

        status = categorize_status(risk_score, anomaly_result["anomaly_flag"])
        prediction, days_until_failure = predict_failure(risk_score)

        priority_score = calculate_priority_score(
            risk_score=risk_score,
            category=category,
            anomaly_flag=anomaly_result["anomaly_flag"],
        )

        reason = generate_prediction_reason(
            risk_score=risk_score,
            trend=trend,
            scores=scores,
            anomaly_flag=anomaly_result["anomaly_flag"],
        )

        last_condition = sorted_reports[0].condition if sorted_reports else "unknown"

        queue_item = DEOQueueItem(
            school_id=school_id,
            category=category,
            status=status,
            risk_score=round(risk_score, 3),
            prediction=prediction,
            days_until_failure=days_until_failure,
            priority_score=round(priority_score, 3),
            anomaly_flag=anomaly_result["anomaly_flag"],
            confidence=round(anomaly_result["hybrid_proba"], 3),
            reason=reason,
            last_condition=last_condition,
        )
        queue_items.append(queue_item)

    # Sort by priority_score descending
    queue_items.sort(key=lambda x: x.priority_score, reverse=True)

    return queue_items


@router.get("/queue/{school_id}", response_model=List[DEOQueueItem])
async def get_priority_queue_for_school(
    school_id: int, db = Depends(get_db)
):
    """
    Get priority queue items for a specific school.
    Filtered and sorted by priority.
    """
    all_reports = await db.report.find_many(
        where={"school_id": school_id}
    )

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

        if len(scores) < 2:
            continue

        risk_score = calculate_risk_score(scores)
        trend = calculate_trend(scores)

        anomaly_result = hybrid_anomaly_detection(
            scores=scores, contamination=0.10, z_threshold=2.0
        )

        status = categorize_status(risk_score, anomaly_result["anomaly_flag"])
        prediction, days_until_failure = predict_failure(risk_score)

        priority_score = calculate_priority_score(
            risk_score=risk_score,
            category=category,
            anomaly_flag=anomaly_result["anomaly_flag"],
        )

        reason = generate_prediction_reason(
            risk_score=risk_score,
            trend=trend,
            scores=scores,
            anomaly_flag=anomaly_result["anomaly_flag"],
        )

        last_condition = sorted_reports[0].condition if sorted_reports else "unknown"

        queue_item = DEOQueueItem(
            school_id=school_id,
            category=category,
            status=status,
            risk_score=round(risk_score, 3),
            prediction=prediction,
            days_until_failure=days_until_failure,
            priority_score=round(priority_score, 3),
            anomaly_flag=anomaly_result["anomaly_flag"],
            confidence=round(anomaly_result["hybrid_proba"], 3),
            reason=reason,
            last_condition=last_condition,
        )
        queue_items.append(queue_item)

    queue_items.sort(key=lambda x: x.priority_score, reverse=True)

    return queue_items


class ApprovedSubmission(BaseModel):
    school_id: int
    category: str
    condition: str
    submitted_by: str
    submission_id: str
    priority_level: str
    priority_score: float = 0.0
    risk_score: float = 0.0
    days_to_failure: int = 30
    reason: str = ""

    class Config:
        from_attributes = True


@router.get("/approved-submissions", response_model=List[ApprovedSubmission])
async def get_approved_submissions(db = Depends(get_db)):
    """
    Get all approved submissions from principals to display as alerts in DEO dashboard.
    These are submissions that have been verified by principals.
    """
    try:
        # Fetch all verified submissions
        submissions = await db.submission.find_many(
            where={"status": "verified"}
        )

        approved_items = []

        for sub in submissions:
            # Map condition to priority
            condition_to_priority = {
                'Good': ('Low', 0.2),
                'Minor Issue': ('Medium', 1.5),
                'Major Issue': ('Critical', 3.8),
            }

            priority_level, priority_score = condition_to_priority.get(
                sub.condition, ('Medium', 1.5)
            )

            # Calculate risk score from condition
            condition_scores = {
                'Good': 0.2,
                'Minor Issue': 0.5,
                'Major Issue': 0.85,
            }
            risk_score = condition_scores.get(sub.condition, 0.5)

            days_to_failure = int(30 + (1 - risk_score) * 30)

            reason_map = {
                'Good': 'Facility in good condition - routine maintenance',
                'Minor Issue': 'Minor issues detected - schedule maintenance within 1 week',
                'Major Issue': 'Critical issues detected - immediate action required',
            }
            reason = reason_map.get(sub.condition, 'Facility review required')

            approved_item = ApprovedSubmission(
                school_id=sub.school_id,
                category=sub.category.title(),
                condition=sub.condition,
                submitted_by=sub.submitted_by,
                submission_id=sub.submission_id,
                priority_level=priority_level,
                priority_score=priority_score,
                risk_score=risk_score,
                days_to_failure=days_to_failure,
                reason=reason
            )
            approved_items.append(approved_item)

        # Sort by priority score descending
        approved_items.sort(key=lambda x: x.priority_score, reverse=True)

        return approved_items

    except Exception as e:
        import logging
        logging.error(f"Error fetching approved submissions: {e}")
        return []
