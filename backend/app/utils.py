from typing import List
from datetime import datetime, timedelta


def condition_to_score(condition: str) -> float:
    """Convert condition string to numeric score."""
    mapping = {
        "good": 0.0,
        "minor": 1.0,
        "major": 3.0,
    }
    return mapping.get(condition.lower(), 0.0)


def calculate_trend(scores: List[float]) -> str:
    """Determine trend from score history."""
    if len(scores) < 2:
        return "insufficient_data"

    scores = sorted(scores)
    early_avg = sum(scores[: len(scores) // 2]) / (len(scores) // 2)
    recent_avg = sum(scores[len(scores) // 2 :]) / (len(scores) - len(scores) // 2)

    if recent_avg > early_avg + 0.3:
        return "worsening"
    elif recent_avg < early_avg - 0.3:
        return "improving"
    else:
        return "stable"


def calculate_risk_score(scores: List[float]) -> float:
    """Calculate risk score from condition scores."""
    if not scores:
        return 0.0
    return sum(scores) / len(scores)


def predict_failure(risk_score: float) -> tuple:
    """Predict failure timeline based on risk score."""
    if risk_score >= 2.0:
        return "30 days", 30
    elif risk_score >= 1.2:
        return "45 days", 45
    elif risk_score >= 0.8:
        return "60 days", 60
    else:
        return "Safe", None


def generate_prediction_reason(risk_score: float, trend: str, scores: List[float]) -> str:
    """Generate explanation for prediction."""
    reasons = []

    if any(score == 3.0 for score in scores):
        reasons.append("repeated major issues")

    if trend == "worsening":
        reasons.append("worsening trend")

    if risk_score >= 2.0:
        reasons.append("critical risk level")

    return "; ".join(reasons) if reasons else "elevated risk"


def calculate_priority_score(
    risk_score: float, category: str, location: str = None
) -> float:
    """Calculate priority score for DEO queue."""
    impact_weights = {
        "girls_toilet": 5.0,
        "boys_toilet": 4.5,
        "classroom": 4.0,
        "lab": 3.5,
        "library": 3.0,
        "canteen": 3.0,
        "office": 2.5,
        "storage": 2.0,
        "other": 2.0,
    }

    weight = impact_weights.get(category.lower(), 2.0)
    return risk_score * weight


def get_last_n_reports(all_reports: List, n: int = 4) -> List[float]:
    """Get last N reports as scores."""
    sorted_reports = sorted(all_reports, key=lambda x: x.timestamp, reverse=True)
    return [report.condition_score for report in sorted_reports[:n]]


def safe_average(values: List[float]) -> float:
    """Calculate safe average."""
    if not values:
        return 0.0
    return sum(values) / len(values)
