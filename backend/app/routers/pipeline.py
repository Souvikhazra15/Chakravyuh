from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict

from ..database import get_db
from ..schemas import (
    PipelineResult,
    BulkPipelineResponse,
    PipelineQueueItem,
    AnomalyDetectionResult,
)
from ..utils import (
    condition_to_score,
    calculate_risk_score,
    calculate_trend,
    predict_failure,
    generate_prediction_reason,
    calculate_priority_score,
    get_last_n_reports,
    hybrid_anomaly_detection,
    compute_rolling_features,
    categorize_status,
    safe_average,
)

router = APIRouter(prefix="/api/v1/pipeline", tags=["pipeline"])


async def compute_school_category_pipeline(
    school_id: int, category: str, db
) -> PipelineResult | None:
    """
    Compute complete ML pipeline for a school-category combination.
    Returns: PipelineResult or None if insufficient data.
    """
    reports = await db.report.find_many(
        where={"school_id": school_id, "category": category},
        order_by={"timestamp": "desc"},
    )

    if len(reports) < 2:
        return None

    # Get last 4 scores
    last_scores = get_last_n_reports(reports, 4)
    risk_score = calculate_risk_score(last_scores)
    trend = calculate_trend(last_scores)

    # Compute rolling features
    rolling_features = compute_rolling_features(last_scores, window=3)

    # Hybrid ML Detection
    anomaly_result = hybrid_anomaly_detection(
        scores=last_scores, contamination=0.10, z_threshold=2.0
    )

    # Status classification
    status = categorize_status(risk_score, anomaly_result["anomaly_flag"])

    # Failure prediction
    prediction, days_until_failure = predict_failure(risk_score)

    # Generate reason
    reason = generate_prediction_reason(
        risk_score=risk_score,
        trend=trend,
        scores=last_scores,
        anomaly_flag=anomaly_result["anomaly_flag"],
    )

    # Confidence (use hybrid probability)
    confidence = anomaly_result["hybrid_proba"]

    return PipelineResult(
        school_id=school_id,
        category=category,
        risk_score=round(risk_score, 3),
        status=status,
        prediction=prediction,
        days_until_failure=days_until_failure,
        trend=trend,
        rolling_mean=round(rolling_features["rolling_mean"], 3),
        rolling_std=round(rolling_features["rolling_std"], 3),
        anomaly_detection=AnomalyDetectionResult(**anomaly_result),
        reason=reason,
        confidence=round(confidence, 3),
        last_scores=[round(s, 3) for s in last_scores],
    )


@router.get("/{school_id}", response_model=BulkPipelineResponse)
async def get_school_pipeline(school_id: int, db = Depends(get_db)):
    """
    Get complete ML pipeline results for all categories of a school.
    Returns risk scores, anomaly flags, and failure predictions.
    """
    all_reports = await db.report.find_many(
        where={"school_id": school_id}
    )

    if not all_reports:
        raise HTTPException(status_code=404, detail="No reports found for school")

    # Group by category
    categories = set(report.category for report in all_reports)

    results = []
    summary = {"Critical": 0, "Warning": 0, "Safe": 0}

    for category in categories:
        pipeline_result = await compute_school_category_pipeline(
            school_id, category, db
        )
        if pipeline_result:
            results.append(pipeline_result)
            summary[pipeline_result.status] += 1

    return BulkPipelineResponse(school_id=school_id, results=results, summary=summary)


@router.get("/{school_id}/{category}", response_model=PipelineResult)
async def get_category_pipeline(
    school_id: int, category: str, db = Depends(get_db)
):
    """
    Get ML pipeline results for a specific school-category combination.
    Includes anomaly detection, risk scoring, and failure prediction.
    """
    pipeline_result = await compute_school_category_pipeline(school_id, category, db)

    if not pipeline_result:
        raise HTTPException(
            status_code=404, detail="Insufficient data for this category"
        )

    return pipeline_result


@router.get("/queue/priority", response_model=List[PipelineQueueItem])
async def get_priority_queue(db = Depends(get_db)):
    """
    Get prioritized maintenance queue for District Education Officer.
    Combines risk score with anomaly detection for priority ranking.
    Sorted by priority_score descending.
    """
    all_reports = await db.report.find_many()

    # Group by school-category
    school_categories = {}
    for report in all_reports:
        key = (report.school_id, report.category)
        if key not in school_categories:
            school_categories[key] = []
        school_categories[key].append(report)

    queue_items = []

    for (school_id, category), reports in school_categories.items():
        sorted_reports = sorted(reports, key=lambda x: x.timestamp, reverse=True)
        last_scores = get_last_n_reports(sorted_reports, 4)

        if len(last_scores) < 2:
            continue

        risk_score = calculate_risk_score(last_scores)
        trend = calculate_trend(last_scores)

        # ML Detection
        anomaly_result = hybrid_anomaly_detection(
            scores=last_scores, contamination=0.10, z_threshold=2.0
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
            scores=last_scores,
            anomaly_flag=anomaly_result["anomaly_flag"],
        )

        last_condition = sorted_reports[0].condition if sorted_reports else "unknown"

        queue_item = PipelineQueueItem(
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
