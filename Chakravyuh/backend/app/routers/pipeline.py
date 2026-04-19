from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from typing import List, Dict
import io
import csv
from datetime import datetime
import numpy as np
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
    calculate_priority_level,
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
    priority_score: float = 0.0  # NEW: Priority ranking score
    priority_level: str = "Medium"  # NEW: Priority level (Critical/High/Medium/Low)

class AnomalyDetectionMetrics(BaseModel):
    timestamp: List[int]  # sequence of indices
    condition_score: List[float]  # condition over time
    zscore_anomaly: List[float]  # Z-score anomaly scores
    isolation_forest_score: List[float]  # Isolation Forest scores
    hybrid_score: List[float]  # Combined hybrid scores
    is_anomaly: List[bool]  # Whether detected as anomaly

class CSVPipelineResult(BaseModel):
    stats: Dict
    predictions: List[CSVPredictionResponse]
    explanations: List[str]
    anomaly_metrics: Dict[str, AnomalyDetectionMetrics] = {}


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
            'all_scores': scores,  # Keep all scores for time-series
            'indices': list(range(len(scores)))
        }
    
    return features


def calculate_anomaly_timeseries(features: Dict) -> Dict:
    """Calculate time-series anomaly scores for each school-category pair."""
    anomaly_metrics = {}
    
    for key, feature_data in features.items():
        school_id, category = key
        scores = feature_data['all_scores']
        indices = feature_data['indices']
        
        # Z-score anomaly for each point
        if len(scores) > 1 and np.std(scores) > 0:
            zscore_anomalies = [np.abs((s - np.mean(scores)) / np.std(scores)) for s in scores]
        else:
            zscore_anomalies = [0.0] * len(scores)
        
        # Isolation Forest on sliding windows
        iforest_scores_ts = []
        if len(scores) >= 3:
            for i in range(max(0, len(scores) - 5), len(scores)):
                window = scores[max(0, i-4):i+1]
                X_window = np.array(window).reshape(-1, 1)
                try:
                    scaler = StandardScaler()
                    X_scaled = scaler.fit_transform(X_window)
                    clf = IsolationForest(contamination=0.2, random_state=42)
                    clf.fit(X_scaled)
                    score = float(-clf.score_samples(X_scaled[-1:].reshape(1, -1))[0])
                    iforest_scores_ts.append(max(0, min(1, score)))
                except:
                    iforest_scores_ts.append(0.0)
            
            # Pad with zeros for earlier points
            iforest_scores_ts = [0.0] * (len(scores) - len(iforest_scores_ts)) + iforest_scores_ts
        else:
            iforest_scores_ts = [0.0] * len(scores)
        
        # Hybrid score (40% Z-score + 60% Isolation Forest)
        hybrid_scores = [
            0.4 * z + 0.6 * i 
            for z, i in zip(zscore_anomalies, iforest_scores_ts)
        ]
        
        # Determine anomalies (threshold: > 0.5)
        is_anomaly = [h > 0.5 for h in hybrid_scores]
        
        anomaly_metrics[f"{school_id}_{category}"] = {
            'timestamp': indices,
            'condition_score': scores,
            'zscore_anomaly': [float(z) for z in zscore_anomalies],
            'isolation_forest_score': [float(i) for i in iforest_scores_ts],
            'hybrid_score': [float(h) for h in hybrid_scores],
            'is_anomaly': is_anomaly
        }
    
    return anomaly_metrics


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
    # Use fit_predict to get the predictions (-1 for anomalies, 1 for normal)
    predictions = clf.fit_predict(X_scaled)
    # Get anomaly scores (lower = more anomalous)
    anomaly_scores_raw = clf.score_samples(X_scaled)
    
    # Normalize anomaly scores to 0-1 range
    min_score = anomaly_scores_raw.min()
    max_score = anomaly_scores_raw.max()
    if max_score > min_score:
        # Invert so that more anomalous = higher score
        normalized = (max_score - anomaly_scores_raw) / (max_score - min_score)
    else:
        normalized = np.zeros_like(anomaly_scores_raw)
    
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
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV file")
        
        # Read file
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Decode with error handling
        try:
            csv_content = contents.decode('utf-8')
        except UnicodeDecodeError:
            csv_content = contents.decode('latin-1')
        
        # Parse CSV
        try:
            reader = csv.DictReader(io.StringIO(csv_content))
            records = list(reader)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
        
        if not records:
            raise HTTPException(status_code=400, detail="CSV file contains no data rows")
        
        # Validate required columns
        required_cols = ['school_id', 'category', 'condition']
        first_record = records[0]
        missing_cols = [col for col in required_cols if col not in first_record]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing_cols)}")
        
        # Stage 1: Data Processing
        print(f"[STAGE 1] Processing {len(records)} records...")
        
        # Stage 2: Feature Engineering
        print("[STAGE 2] Engineering features (trends, patterns)...")
        features = calculate_csv_features(records)
        
        if not features:
            raise HTTPException(status_code=400, detail="No valid data to process")
        
        # Stage 3: Hybrid Anomaly Detection
        print("[STAGE 3] Hybrid anomaly detection (Z-score + Isolation Forest)...")
        anomaly_scores = hybrid_csv_anomaly_detection(features)
        
        # Calculate time-series anomaly metrics
        print("[STAGE 3B] Calculating time-series anomaly metrics...")
        anomaly_metrics = calculate_anomaly_timeseries(features)
        
        # Stage 4-5: Prediction & Explanation
        print("[STAGE 4-5] Generating predictions...")
        predictions = []
        
        for key, feature_data in features.items():
            school_id, category = key
            anomaly_score = anomaly_scores[key]
            
            days_to_failure, priority, risk_score = csv_predict_failure_timeline(
                feature_data, anomaly_score
            )
            
            # Calculate priority level based on risk score and student impact
            priority_score, priority_level = calculate_priority_level(category, risk_score)
            
            predictions.append(CSVPredictionResponse(
                school_id=school_id,
                category=category,
                risk_score=risk_score,
                days_to_failure=days_to_failure,
                priority=priority,
                condition_score=feature_data['current_score'],
                trend_slope=feature_data['trend_slope'],
                priority_score=priority_score,
                priority_level=priority_level
            ))
        
        # Sort by priority level and risk score (descending)
        priority_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
        predictions.sort(
            key=lambda p: (priority_order.get(p.priority_level, 4), -p.priority_score, -p.risk_score)
        )
        
        # Generate explanations
        explanations = []
        for pred in predictions:
            if pred.priority_level == "Critical":
                explanations.append(
                    f"🔴 {pred.school_id} - {pred.category.title()}: "
                    f"CRITICAL RISK (Score: {pred.priority_score:.1f}). "
                    f"Predict failure in {pred.days_to_failure} days. Immediate action required."
                )
            elif pred.priority_level == "High":
                explanations.append(
                    f"⚠️ {pred.school_id} - {pred.category.title()}: "
                    f"HIGH PRIORITY (Score: {pred.priority_score:.1f}). "
                    f"Action recommended within {pred.days_to_failure} days."
                )
        
        if not explanations:
            explanations = ["✓ All monitored facilities within normal parameters."]
        
        # Stage 6: Return results for DEO
        result = CSVPipelineResult(
            stats={
                "processed_records": len(records),
                "school_category_combinations": len(features),
                "critical_issues": sum(1 for p in predictions if p.priority_level == "Critical"),
                "high_priority_issues": sum(1 for p in predictions if p.priority_level == "High"),
                "medium_priority_issues": sum(1 for p in predictions if p.priority_level == "Medium"),
                "low_priority_issues": sum(1 for p in predictions if p.priority_level == "Low"),
                "processing_timestamp": datetime.now().isoformat(),
            },
            predictions=predictions,
            explanations=explanations,
            anomaly_metrics=anomaly_metrics
        )
        
        print(f"✓ Pipeline complete! {len(predictions)} predictions generated")
        return result
        
    except HTTPException as he:
        print(f"HTTPException: {he.detail}")
        raise he
    except Exception as e:
        print(f"❌ Error processing CSV: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")
