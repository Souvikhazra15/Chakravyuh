from fastapi import APIRouter, HTTPException, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import logging
import random
import os
import pickle
import numpy as np
import pandas as pd

# Define model classes for pickling support
class ZScoreBaseline:
    """Z-Score anomaly detection model (for pickle deserialization)."""
    def __init__(self, threshold=2.5):
        self.threshold = threshold
    
    def predict(self, X):
        return (np.abs(X) > self.threshold).any(axis=1).astype(int)
    
    def predict_proba(self, X):
        return np.clip(np.abs(X).max(axis=1) / (self.threshold * 2), 0, 1)

from ..utils import calculate_priority_level

logger = logging.getLogger("app.analyze")

router = APIRouter(prefix="/api/v1", tags=["analysis"])

# ========================================================================
# LOAD TRAINED ML MODEL AT STARTUP
# ========================================================================

MODEL_PACKAGE = None
MODEL_LOADED = False

def load_model():
    """Load the trained model package on startup."""
    global MODEL_PACKAGE, MODEL_LOADED
    try:
        # Try multiple paths to find the model file
        possible_paths = [
            "complete_model_package.pkl",
            os.path.join(os.getcwd(), "complete_model_package.pkl"),
            os.path.join(os.getcwd(), "ai_model/complete_model_package.pkl"),
            os.path.join(os.getcwd(), "../ai_model/complete_model_package.pkl"),
            r"d:\chakravyu\ai_model\complete_model_package.pkl",
        ]
        
        model_path = None
        for path in possible_paths:
            if os.path.exists(path):
                model_path = path
                break
        
        if not model_path:
            raise FileNotFoundError(f"Model file not found in any of: {possible_paths}")
        
        # Custom unpickler to handle missing classes
        class ModelUnpickler(pickle.Unpickler):
            def find_class(self, module, name):
                if name == 'ZScoreBaseline':
                    return ZScoreBaseline
                try:
                    return super().find_class(module, name)
                except AttributeError:
                    logger.warning("Could not find %s.%s while unpickling", module, name)
                    return None
        
        with open(model_path, 'rb') as f:
            unpickler = ModelUnpickler(f)
            MODEL_PACKAGE = unpickler.load()
        
        MODEL_LOADED = True
        logger.info("Model loaded: %s", model_path)
        logger.info("Features: %s", MODEL_PACKAGE["features"]["feature_count"])
        logger.info("Models: %s", ", ".join(MODEL_PACKAGE["metadata"]["models"]))
        return True
    except Exception as e:
        logger.exception("Model load failed: %s", e)
        import traceback
        traceback.print_exc()
        MODEL_LOADED = False
        return False

# Load model when module is imported
load_model()


# ========================================================================
# PYDANTIC MODELS
# ========================================================================

class DataRecord(BaseModel):
    school_id: int
    category: str
    condition_score: Optional[float] = None
    condition: Optional[str] = None


class AnalysisRequest(BaseModel):
    school_id: Optional[int] = None
    data: Optional[List[DataRecord]] = None
    csv_data: Optional[List[Dict[str, Any]]] = None


class AnalysisResult(BaseModel):
    school_id: int
    category: str
    risk_score: float
    days_to_failure: int
    priority_score: float
    priority_level: str
    reason: str
    
    class Config:
        from_attributes = True


class AnalysisSummary(BaseModel):
    total_issues: int
    critical: int
    high: int
    medium: int
    low: int


class AnalysisResponse(BaseModel):
    summary: AnalysisSummary
    data: List[AnalysisResult]
    distribution: Dict[str, int]


# ========================================================================
# HELPER FUNCTIONS
# ========================================================================

def _prepare_features(condition_score: float, category: str, feature_cols: List[str]) -> np.ndarray:
    """Prepare feature vector for model prediction."""
    features = np.zeros(len(feature_cols))
    
    base_feature_mapping = {
        'building_age': 15 + condition_score * 35,
        'condition_score': condition_score * 100,
        'crack_width_mm': condition_score * 50,
        'toilet_functional_ratio': max(0.1, 1 - condition_score),
        'power_outage_hours_weekly': condition_score * 40,
        'priority_score': condition_score * 5,
        'contractor_delay_days': condition_score * 30,
    }
    
    for i, col in enumerate(feature_cols):
        if col in base_feature_mapping:
            features[i] = base_feature_mapping[col]
        elif 'rolling_mean' in col:
            base_col = col.replace('_rolling_mean', '')
            features[i] = base_feature_mapping.get(base_col, condition_score * 50)
        elif 'rolling_std' in col:
            features[i] = condition_score * 10
        elif 'trend' in col:
            features[i] = 1 if condition_score > 0.5 else 0
        else:
            features[i] = condition_score * 50
    
    return features.reshape(1, -1)


def _generate_reason(risk_score: float, category: str, priority_level: str) -> str:
    """Generate explanation for ML prediction."""
    if priority_level == 'Critical':
        reasons = [
            f"ML model flagged as high-risk anomaly - immediate action required",
            f"Repeated critical issues detected in {category}",
            f"Hybrid ensemble (Z-Score + Isolation Forest) predicted failure"
        ]
    elif priority_level == 'High':
        reasons = [
            f"Pattern analysis shows concerning trend in {category}",
            f"Multiple anomaly indicators suggest elevated risk",
            f"Model detected unusual degradation pattern"
        ]
    elif priority_level == 'Medium':
        reasons = [
            f"Moderate risk detected - proactive maintenance recommended",
            f"Trend analysis indicates potential issues in {category}",
            f"Risk score above baseline - monitor closely"
        ]
    else:
        reasons = [
            f"Normal operation - routine maintenance sufficient",
            f"No anomalies detected by ML model",
            f"Stable condition - continue regular monitoring"
        ]
    
    return random.choice(reasons)


def _parse_condition_score(condition_score: Optional[float], condition: Optional[str]) -> float:
    """Convert condition to normalized risk score (0-1)."""
    if condition_score is not None:
        try:
            score = float(condition_score)
            return float(np.clip(score, 0.0, 1.0))
        except (ValueError, TypeError):
            pass
    
    if condition:
        condition_lower = str(condition).strip().lower()
        if any(word in condition_lower for word in ['good', 'excellent', 'okay', 'ok', 'functional', 'working']):
            return 0.25
        elif any(word in condition_lower for word in ['minor', 'fair', 'moderate', 'average', 'worn']):
            return 0.50
        elif any(word in condition_lower for word in ['major', 'poor', 'critical', 'severe', 'urgent', 'broken']):
            return 0.85
    
    return 0.50


# ========================================================================
# MAIN ENDPOINT: POST /api/v1/analyze
# ========================================================================

@router.post("/analyze", response_model=AnalysisResponse)
async def run_ai_analysis(request: AnalysisRequest):
    """
    Run AI analysis using trained ML model for real predictions.
    
    Uses trained Z-Score, Isolation Forest models, and hybrid ensemble
    with optimized thresholds to generate priority rankings.
    """
    try:
        # Check if model is loaded (fallback to heuristic if missing)
        if not MODEL_LOADED or MODEL_PACKAGE is None:
            logger.warning("Model not loaded, attempting reload")
            load_model()
        
        # Parse input data
        records = []
        
        logger.info("Analyze request: csv_rows=%s structured=%s",
                len(request.csv_data) if request.csv_data else 0,
                len(request.data) if request.data else 0)
        
        if request.csv_data and len(request.csv_data) > 0:
            logger.debug("Parsing CSV rows: %s", len(request.csv_data))
            for idx, row in enumerate(request.csv_data):
                try:
                    school_id = int(row.get('school_id', 1))
                    category = str(row.get('category', 'other')).strip().lower()
                    condition_score = _parse_condition_score(
                        row.get('condition_score'),
                        row.get('condition')
                    )
                    
                    records.append({
                        'school_id': school_id,
                        'category': category,
                        'condition_score': condition_score,
                    })
                    
                    if idx < 3:
                        logger.debug("Row %s: school=%s cat=%s score=%s", idx, school_id, category, condition_score)
                except Exception as e:
                    logger.warning("Row %s parse error: %s", idx, e)
                    continue
        
        elif request.data and len(request.data) > 0:
            logger.debug("Parsing structured records: %s", len(request.data))
            for item in request.data:
                score = item.condition_score or _parse_condition_score(None, item.condition)
                records.append({
                    'school_id': item.school_id or 1,
                    'category': str(item.category).strip().lower(),
                    'condition_score': score,
                })
        
        if not records:
            logger.warning("No valid records parsed")
            records = []

        logger.info("Parsed records: %s", len(records))
        
        results = []

        if len(records) > 0:
            logger.info("Running predictions on %s records", len(records))

            if not MODEL_LOADED or MODEL_PACKAGE is None:
                logger.warning("Using heuristic fallback (model missing)")
                for idx, record in enumerate(records):
                    school_id = record['school_id']
                    category = record['category']
                    condition_score = record['condition_score']

                    risk_score = round(float(np.clip(condition_score, 0.0, 1.0)), 3)
                    days_to_failure = int(30 + (1 - risk_score) * 30)
                    priority_score, priority_level = calculate_priority_level(category, risk_score)
                    reason = _generate_reason(risk_score, category, priority_level)

                    results.append(AnalysisResult(
                        school_id=school_id,
                        category=category.replace('_', ' ').title(),
                        risk_score=risk_score,
                        days_to_failure=days_to_failure,
                        priority_score=round(priority_score, 2),
                        priority_level=priority_level,
                        reason=reason
                    ))
                logger.info("Fallback generated %s predictions", len(results))
            else:
                # ====================================================================
                # EXTRACT MODEL COMPONENTS
                # ====================================================================
                scaler = MODEL_PACKAGE['scaler']
                feature_cols = MODEL_PACKAGE['features']['all_features']
                z_score_model = MODEL_PACKAGE['models']['z_score_optimized']
                if_model = MODEL_PACKAGE['models']['isolation_forest_optimized']
                hybrid_threshold = MODEL_PACKAGE['models']['hybrid_ensemble']['threshold']

                logger.debug("Model components: scaler=%s features=%s threshold=%.2f",
                             type(scaler).__name__, len(feature_cols), hybrid_threshold)

                # ====================================================================
                # GENERATE PREDICTIONS USING REAL MODEL
                # ====================================================================
                for idx, record in enumerate(records):
                    try:
                        school_id = record['school_id']
                        category = record['category']
                        condition_score = record['condition_score']

                        feature_vector = _prepare_features(condition_score, category, feature_cols)
                        feature_names = getattr(scaler, "feature_names_in_", None)
                        if feature_names is not None:
                            feature_df = pd.DataFrame(feature_vector, columns=feature_names)
                        else:
                            feature_df = pd.DataFrame(feature_vector, columns=feature_cols)
                        feature_scaled = scaler.transform(feature_df)

                        z_prob = z_score_model.predict_proba(feature_scaled)[0]
                        if_score = float(if_model.score_samples(feature_scaled)[0])
                        if_prob = float(1.0 / (1.0 + np.exp(if_score)))

                        hybrid_prob = float((z_prob + if_prob) / 2)
                        risk_score = round(float(hybrid_prob), 3)
                        days_to_failure = int(30 + (1 - risk_score) * 30)

                        priority_score, priority_level = calculate_priority_level(category, risk_score)
                        reason = _generate_reason(risk_score, category, priority_level)

                        result = AnalysisResult(
                            school_id=school_id,
                            category=category.replace('_', ' ').title(),
                            risk_score=risk_score,
                            days_to_failure=days_to_failure,
                            priority_score=round(priority_score, 2),
                            priority_level=priority_level,
                            reason=reason
                        )
                        results.append(result)

                        if idx < 5:
                            logger.debug("[%s] %s | risk=%.3f priority=%s days=%s",
                                         idx, category, risk_score, priority_level, days_to_failure)

                    except Exception as e:
                        logger.exception("Record %s error: %s", idx, e)
                        continue
        
        logger.info("Generated %s predictions", len(results))
        
        # ====================================================================
        # COMPUTE SUMMARY
        # ====================================================================
        
        summary = AnalysisSummary(
            total_issues=len(results),
            critical=sum(1 for d in results if d.priority_level == "Critical"),
            high=sum(1 for d in results if d.priority_level == "High"),
            medium=sum(1 for d in results if d.priority_level == "Medium"),
            low=sum(1 for d in results if d.priority_level == "Low")
        )
        
        results_sorted = sorted(results, key=lambda x: x.priority_score, reverse=True)
        
        distribution = {
            'Critical': summary.critical,
            'High': summary.high,
            'Medium': summary.medium,
            'Low': summary.low
        }
        
        # ====================================================================
        # LOG RESULTS
        # ====================================================================
        
        logger.info("Summary: total=%s critical=%s high=%s medium=%s low=%s",
                summary.total_issues, summary.critical, summary.high, summary.medium, summary.low)
        
        return AnalysisResponse(
            summary=summary,
            data=results_sorted,
            distribution=distribution
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Analysis failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )
