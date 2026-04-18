from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest


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


def generate_prediction_reason(risk_score: float, trend: str, scores: List[float], anomaly_flag: bool = False) -> str:
    """Generate explanation for prediction."""
    reasons = []

    if anomaly_flag:
        reasons.append("anomalous pattern detected")

    if any(score == 3.0 for score in scores):
        reasons.append("repeated major issues")

    if trend == "worsening":
        reasons.append("worsening trend")

    if risk_score >= 2.0:
        reasons.append("critical risk level")

    return " + ".join(reasons) if reasons else "elevated risk"


def calculate_priority_score(
    risk_score: float, category: str, anomaly_flag: bool = False, location: str = None
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
    base_score = risk_score * weight
    
    if anomaly_flag:
        base_score *= 1.3
    
    return base_score


def get_last_n_reports(all_reports: List, n: int = 4) -> List[float]:
    """Get last N reports as scores."""
    sorted_reports = sorted(all_reports, key=lambda x: x.timestamp, reverse=True)
    return [report.condition_score for report in sorted_reports[:n]]


def safe_average(values: List[float]) -> float:
    """Calculate safe average."""
    if not values:
        return 0.0
    return sum(values) / len(values)


# ============================================================================
# ML PIPELINE: Z-SCORE + ISOLATION FOREST HYBRID MODEL
# ============================================================================

class ZScoreDetector:
    """Z-Score based anomaly detector with dynamic threshold optimization."""
    
    def __init__(self, threshold: float = 2.0):
        self.threshold = threshold
        self.mean = None
        self.std = None
    
    def fit(self, X: np.ndarray):
        """Fit z-score parameters on training data."""
        self.mean = np.mean(X)
        self.std = np.std(X)
        if self.std == 0:
            self.std = 1.0
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict anomalies (1) or normal (0)."""
        if self.mean is None or self.std is None:
            return np.zeros(len(X), dtype=int)
        z_scores = np.abs((X - self.mean) / self.std)
        return (z_scores > self.threshold).astype(int)
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Return anomaly probability scores [0, 1]."""
        if self.mean is None or self.std is None:
            return np.zeros(len(X))
        z_scores = np.abs((X - self.mean) / self.std)
        proba = np.clip(z_scores / (self.threshold * 2), 0, 1)
        return proba


def compute_rolling_features(scores: List[float], window: int = 3) -> Dict:
    """Compute rolling mean and trend from score history."""
    if len(scores) < 2:
        return {
            "rolling_mean": safe_average(scores),
            "trend": 0,
            "rolling_std": 0.0
        }
    
    scores_array = np.array(scores)
    
    rolling_mean = np.mean(scores_array[-window:]) if len(scores) >= window else np.mean(scores_array)
    rolling_std = np.std(scores_array[-window:]) if len(scores) >= window else np.std(scores_array)
    
    trend = 1 if scores[-1] > scores[0] else (-1 if scores[-1] < scores[0] else 0)
    
    return {
        "rolling_mean": float(rolling_mean),
        "trend": trend,
        "rolling_std": float(rolling_std)
    }


def hybrid_anomaly_detection(scores: List[float], 
                             contamination: float = 0.1,
                             z_threshold: float = 2.0) -> Dict:
    """
    Hybrid Z-Score + Isolation Forest anomaly detection.
    
    Args:
        scores: List of condition scores (floats)
        contamination: Expected proportion of outliers for IF (0.08-0.12)
        z_threshold: Z-score threshold (1.5-3.0)
    
    Returns:
        Dictionary with predictions, probabilities, and explanations
    """
    if len(scores) < 3:
        return {
            "z_pred": 0,
            "if_pred": 0,
            "hybrid_pred": 0,
            "z_proba": 0.0,
            "if_proba": 0.0,
            "hybrid_proba": 0.0,
            "anomaly_flag": False,
            "confidence": 0.0
        }
    
    scores_array = np.array(scores).reshape(-1, 1)
    
    # Z-Score Detection
    z_detector = ZScoreDetector(threshold=z_threshold)
    z_detector.fit(scores_array)
    z_pred = z_detector.predict(scores_array)[-1]
    z_proba = z_detector.predict_proba(scores_array)[-1]
    
    # Isolation Forest Detection
    try:
        if_model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        if_model.fit(scores_array)
        if_raw_pred = if_model.predict(scores_array)[-1]
        if_pred = 1 if if_raw_pred == -1 else 0
        
        # Get anomaly score and normalize to [0, 1]
        anomaly_scores = if_model.score_samples(scores_array)
        if_proba = 1 - (anomaly_scores[-1] - anomaly_scores.min()) / (anomaly_scores.max() - anomaly_scores.min() + 1e-6)
        if_proba = np.clip(if_proba, 0, 1)
    except:
        if_pred = 0
        if_proba = 0.0
    
    # Hybrid Logic: Combine both models
    hybrid_proba = (z_proba + if_proba) / 2
    hybrid_pred = 1 if hybrid_proba >= 0.5 else 0
    
    # Anomaly flag: True if either model predicts anomaly
    anomaly_flag = bool(z_pred or if_pred)
    
    # Confidence: average probability
    confidence = float(hybrid_proba)
    
    return {
        "z_pred": int(z_pred),
        "if_pred": int(if_pred),
        "hybrid_pred": int(hybrid_pred),
        "z_proba": float(z_proba),
        "if_proba": float(if_proba),
        "hybrid_proba": float(hybrid_proba),
        "anomaly_flag": anomaly_flag,
        "confidence": confidence
    }


def categorize_status(risk_score: float, anomaly_flag: bool) -> str:
    """Categorize status into Critical, Warning, or Safe."""
    if risk_score >= 2.0 or (anomaly_flag and risk_score >= 1.5):
        return "Critical"
    elif risk_score >= 1.0 or anomaly_flag:
        return "Warning"
    else:
        return "Safe"
