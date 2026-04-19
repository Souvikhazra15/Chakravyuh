from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..schemas import ExplainResponse
from ..utils import (
    calculate_risk_score,
    calculate_trend,
    generate_prediction_reason,
    get_last_n_reports,
)

router = APIRouter(prefix="/api/v1/explain", tags=["explainability"])


@router.get("/{school_id}/{category}", response_model=ExplainResponse)
async def explain_prediction(
    school_id: int,
    category: str,
    db = Depends(get_db),
):
    """
    Get explainable AI reasoning for failure prediction.
    
    Shows the factors contributing to the prediction.
    """
    reports = await db.report.find_many(
        where={"school_id": school_id, "category": category.lower()},
        order_by={"timestamp": "desc"},
    )

    if not reports:
        raise HTTPException(
            status_code=404,
            detail=f"No reports found for school {school_id} in category {category}",
        )

    scores = get_last_n_reports(reports, 4)
    risk_score = calculate_risk_score(scores)
    trend = calculate_trend(scores)
    explanation = generate_prediction_reason(risk_score, trend, scores)

    detail_explanation = (
        f"Category: {category.capitalize()}. "
        f"Risk Score: {risk_score:.2f}. "
        f"Trend: {trend}. "
        f"Last 4 scores: {scores}. "
        f"Key factors: {explanation}"
    )

    return ExplainResponse(
        category=category,
        explanation=detail_explanation,
        last_4_scores=scores,
        trend=trend,
        risk_score=risk_score,
    )


@router.get("/{school_id}", response_model=list[ExplainResponse])
async def explain_all_predictions(
    school_id: int,
    db = Depends(get_db),
):
    """Get explanations for all categories."""
    categories = ["plumbing", "electrical", "structural"]
    explanations = []

    for category in categories:
        reports = await db.report.find_many(
            where={"school_id": school_id, "category": category},
            order_by={"timestamp": "desc"},
        )

        if not reports:
            explanations.append(
                ExplainResponse(
                    category=category,
                    explanation="No data available",
                    last_4_scores=[],
                    trend="no_data",
                    risk_score=0.0,
                )
            )
            continue

        scores = get_last_n_reports(reports, 4)
        risk_score = calculate_risk_score(scores)
        trend = calculate_trend(scores)
        explanation = generate_prediction_reason(risk_score, trend, scores)

        detail_explanation = (
            f"Category: {category.capitalize()}. "
            f"Risk Score: {risk_score:.2f}. "
            f"Trend: {trend}. "
            f"Last 4 scores: {scores}. "
            f"Key factors: {explanation}"
        )

        explanations.append(
            ExplainResponse(
                category=category,
                explanation=detail_explanation,
                last_4_scores=scores,
                trend=trend,
                risk_score=risk_score,
            )
        )

    return explanations
