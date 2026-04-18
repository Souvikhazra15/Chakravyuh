from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..schemas import PredictionResponse
from ..utils import (
    calculate_risk_score,
    calculate_trend,
    predict_failure,
    generate_prediction_reason,
    get_last_n_reports,
)

router = APIRouter(prefix="/api/v1/prediction", tags=["predictions"])


@router.get("/{school_id}", response_model=list[PredictionResponse])
async def get_predictions_for_school(
    school_id: int,
    db = Depends(get_db),
):
    """Get failure predictions for all categories of a school."""
    categories = ["plumbing", "electrical", "structural"]
    predictions = []

    for category in categories:
        reports = await db.report.find_many(
            where={"school_id": school_id, "category": category},
            order_by={"timestamp": "desc"},
        )

        if not reports:
            predictions.append(
                PredictionResponse(
                    category=category,
                    prediction="Safe",
                    days_until_failure=None,
                    reason="no_data",
                    risk_score=0.0,
                )
            )
            continue

        scores = get_last_n_reports(reports, 4)
        risk_score = calculate_risk_score(scores)
        trend = calculate_trend(scores)
        prediction, days = predict_failure(risk_score)
        reason = generate_prediction_reason(risk_score, trend, scores)

        predictions.append(
            PredictionResponse(
                category=category,
                prediction=prediction,
                days_until_failure=days,
                reason=reason,
                risk_score=risk_score,
            )
        )

    return predictions


@router.get("/{school_id}/{category}", response_model=PredictionResponse)
async def get_prediction_for_category(
    school_id: int,
    category: str,
    db = Depends(get_db),
):
    """Get failure prediction for a specific category."""
    reports = await db.report.find_many(
        where={"school_id": school_id, "category": category.lower()},
        order_by={"timestamp": "desc"},
    )

    if not reports:
        return PredictionResponse(
            category=category,
            prediction="Safe",
            days_until_failure=None,
            reason="no_data",
            risk_score=0.0,
        )

    scores = get_last_n_reports(reports, 4)
    risk_score = calculate_risk_score(scores)
    trend = calculate_trend(scores)
    prediction, days = predict_failure(risk_score)
    reason = generate_prediction_reason(risk_score, trend, scores)

    return PredictionResponse(
        category=category,
        prediction=prediction,
        days_until_failure=days,
        reason=reason,
        risk_score=risk_score,
    )
