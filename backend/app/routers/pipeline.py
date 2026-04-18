from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from typing import List, Dict
import io
import csv
from datetime import datetime
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from pydantic import BaseModel

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


# ============================================================================
# CSV PROCESSING PIPELINE - For demo/testing with file uploads
# ============================================================================

class CSVPredictionResponse(BaseModel):
    school_id: str
    category: str
    risk_score: float
    days_to_failure: int
    priority: str
    condition_score: float
    trend_slope: float

class CSVPipelineResult(BaseModel):
    stats: Dict
    predictions: List[CSVPredictionResponse]
    explanations: List[str]


def normalize_condition_score(raw_condition: str) -> float:
    """Convert condition string to 0-100 score."""
    condition_map = {
        "excellent": 0.1,
        "good": 0.25,
        "fair": 0.5,
        "poor": 0.75,
        "critical": 0.95
    }
    return condition_map.get(raw_condition.lower(), 0.5)


def calculate_csv_features(records: List[Dict]) -> Dict:
    """Calculate features for each school-category combination from CSV."""
    grouped = {}
    
    for record in records:
        school_id = record.get('school_id', 'unknown')
        category = record.get('category', 'other').lower()
        condition = record.get('condition', 'fair')
        
        key = (school_id, category)
        if key not in grouped:
            grouped[key] = []
        
        grouped[key].append({
            'score': normalize_condition_score(condition),
            'raw_condition': condition,
        })
    
    features = {}
    for key, records_list in grouped.items():
        school_id, category = key
        scores = [r['score'] for r in records_list]
        
        # Calculate trend (linear regression slope)
        x = np.arange(len(scores))
        if len(scores) > 1:
            z = np.polyfit(x, scores, 1)
            trend_slope = float(z[0])
        else:
            trend_slope = 0.0
        
        rolling_avg = float(np.mean(scores[-3:]) if len(scores) >= 3 else np.mean(scores))
        
        if len(scores) > 1:
            deterioration_rate = float(np.mean(np.diff(scores)))
        else:
            deterioration_rate = 0.0
        
        features[key] = {
            'school_id': school_id,
            'category': category,
            'current_score': float(scores[-1]),
            'rolling_avg': rolling_avg,
            'trend_slope': trend_slope,
            'deterioration_rate': deterioration_rate,
            'num_reports': len(scores),
            'all_scores': scores
        }
    
    return features


def hybrid_csv_anomaly_detection(features: Dict) -> Dict:
    """Hybrid anomaly detection: Z-score + Isolation Forest."""
    if len(features) < 2:
        return {key: 0.0 for key in features.keys()}
    
    # Z-score detection
    all_trends = [f['trend_slope'] for f in features.values()]
    all_rates = [f['deterioration_rate'] for f in features.values()]
    
    zscore_scores = {}
    for key, feature_data in features.items():
        trend = feature_data['trend_slope']
        rate = feature_data['deterioration_rate']
        
        if len(all_trends) > 1 and np.std(all_trends) > 0:
            trend_zscore = np.abs((trend - np.mean(all_trends)) / np.std(all_trends))
        else:
            trend_zscore = 0
        
        if len(all_rates) > 1 and np.std(all_rates) > 0:
            rate_zscore = np.abs((rate - np.mean(all_rates)) / np.std(all_rates))
        else:
            rate_zscore = 0
        
        zscore_scores[key] = float(min(max(trend_zscore, rate_zscore) / 2.0, 1.0))
    
    # Isolation Forest detection
    X = np.array([
        [
            f['current_score'],
            f['rolling_avg'],
            f['trend_slope'],
            f['deterioration_rate'],
            f['num_reports']
        ]
        for f in features.values()
    ])
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    clf = IsolationForest(contamination=0.2, random_state=42)
    anomaly_scores = clf.score_samples(X_scaled)
    
    min_score = anomaly_scores.min()
    max_score = anomaly_scores.max()
    if max_score > min_score:
        normalized = (anomaly_scores - min_score) / (max_score - min_score)
    else:
        normalized = np.zeros_like(anomaly_scores)
    
    iforest_scores = {}
    for (key, _), score in zip(features.items(), normalized):
        iforest_scores[key] = float(score)
    
    # Hybrid: 40% Z-score + 60% Isolation Forest
    hybrid_scores = {}
    for key in features.keys():
        hybrid_scores[key] = 0.4 * zscore_scores[key] + 0.6 * iforest_scores[key]
    
    return hybrid_scores


def csv_predict_failure_timeline(feature_data: Dict, anomaly_score: float) -> tuple:
    """Predict days to failure and priority."""
    current_score = feature_data['current_score']
    rate = feature_data['deterioration_rate']
    trend = feature_data['trend_slope']
    
    failure_threshold = 0.85
    remaining_capacity = max(0, failure_threshold - current_score)
    
    if rate > 0.01:
        weeks_remaining = remaining_capacity / rate
        days_remaining = max(1, int(weeks_remaining * 7))
    else:
        days_remaining = 180
    
    days_remaining = max(30, min(60, days_remaining))
    
    risk_score = (current_score + anomaly_score + max(0, trend)) / 3.0
    
    if risk_score > 0.7 or days_remaining < 40:
        priority = "critical"
    elif risk_score > 0.5 or days_remaining < 50:
        priority = "high"
    else:
        priority = "medium"
    
    return days_remaining, priority, risk_score


@router.post("/process-csv", response_model=CSVPipelineResult)
async def process_csv_pipeline(file: UploadFile = File(...)):
    """
    Process CSV file through complete hybrid ML pipeline.
    
    Expected CSV format:
    school_id,category,condition,timestamp
    SCHOOL_001,plumbing,fair,2026-04-18
    SCHOOL_002,electrical,poor,2026-04-18
    """
    try:
        # Read file
        contents = await file.read()
        csv_content = contents.decode('utf-8')
        
        # Parse CSV
        reader = csv.DictReader(io.StringIO(csv_content))
        records = list(reader)
        
        if not records:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Stage 1: Data Processing
        print(f"[STAGE 1] Processing {len(records)} records...")
        
        # Stage 2: Feature Engineering
        print("[STAGE 2] Engineering features (trends, patterns)...")
        features = calculate_csv_features(records)
        
        # Stage 3: Hybrid Anomaly Detection
        print("[STAGE 3] Hybrid anomaly detection (Z-score + Isolation Forest)...")
        anomaly_scores = hybrid_csv_anomaly_detection(features)
        
        # Stage 4-5: Prediction & Explanation
        print("[STAGE 4-5] Generating predictions...")
        predictions = []
        
        for key, feature_data in features.items():
            school_id, category = key
            anomaly_score = anomaly_scores[key]
            
            days_to_failure, priority, risk_score = csv_predict_failure_timeline(
                feature_data, anomaly_score
            )
            
            predictions.append(CSVPredictionResponse(
                school_id=school_id,
                category=category,
                risk_score=risk_score,
                days_to_failure=days_to_failure,
                priority=priority,
                condition_score=feature_data['current_score'],
                trend_slope=feature_data['trend_slope']
            ))
        
        # Sort by priority
        priority_order = {"critical": 0, "high": 1, "medium": 2}
        predictions.sort(
            key=lambda p: (priority_order.get(p.priority, 3), -p.risk_score)
        )
        
        # Generate explanations
        explanations = []
        for pred in predictions:
            if pred.priority == "critical":
                explanations.append(
                    f"🔴 {pred.school_id} - {pred.category.title()}: "
                    f"Critical risk detected. Predict failure in {pred.days_to_failure} days."
                )
            elif pred.priority == "high":
                explanations.append(
                    f"⚠️ {pred.school_id} - {pred.category.title()}: "
                    f"High priority. Deterioration accelerating. Action recommended within {pred.days_to_failure} days."
                )
        
        if not explanations:
            explanations = ["✓ All monitored facilities within normal parameters."]
        
        # Stage 6: Return results for DEO
        result = CSVPipelineResult(
            stats={
                "processed_records": len(records),
                "school_category_combinations": len(features),
                "critical_issues": sum(1 for p in predictions if p.priority == "critical"),
                "high_priority_issues": sum(1 for p in predictions if p.priority == "high"),
                "processing_timestamp": datetime.now().isoformat(),
            },
            predictions=predictions,
            explanations=explanations
        )
        
        print(f"✓ Pipeline complete!")
        return result
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")
