"""
ShalaRakshak - ML Pipeline API Documentation
AI-Powered Predictive Maintenance System for Government Schools

ARCHITECTURE:
=============

1. DATA INGESTION
   - Reports come in via POST /api/v1/report
   - Each report: school_id, category, condition, timestamp

2. FEATURE ENGINEERING
   - Rolling mean (last 3-4 scores)
   - Rolling std deviation
   - Trend detection (worsening/stable/improving)

3. ML PIPELINE
   - Z-Score Detector: Identify outlier scores
   - Isolation Forest: Detect anomalous patterns
   - Hybrid Logic: Combine both models (OR logic)

4. RISK CLASSIFICATION
   - Critical: risk_score >= 2.0 OR (anomaly + risk >= 1.5)
   - Warning: risk_score >= 1.0 OR anomaly detected
   - Safe: risk_score < 1.0 AND no anomaly

5. FAILURE PREDICTION
   - Critical (risk >= 2.0) → 30 days
   - Warning (risk >= 1.2) → 45 days
   - Safe (risk < 0.8) → 60 days or Safe

6. PRIORITY RANKING
   - Base: risk_score * category_weight
   - Boost: +30% if anomaly detected
   - Category weights: girls_toilet=5.0, classroom=4.0, etc.

============================================================================
API ENDPOINTS
============================================================================

1. POST /api/v1/report
   Create a new maintenance report
   
   Request:
   {
     "school_id": 101,
     "category": "girls_toilet",
     "condition": "major",
     "photo_url": "https://..."
   }
   
   Response:
   {
     "id": 1,
     "school_id": 101,
     "category": "girls_toilet",
     "condition": "major",
     "condition_score": 3.0,
     "timestamp": "2024-01-15T10:30:00"
   }


2. GET /api/v1/pipeline/{school_id}/{category}
   Get ML pipeline results for a specific category
   
   Response:
   {
     "school_id": 101,
     "category": "girls_toilet",
     "risk_score": 2.3,
     "status": "Critical",
     "prediction": "30 days",
     "days_until_failure": 30,
     "trend": "worsening",
     "rolling_mean": 2.1,
     "rolling_std": 0.4,
     "anomaly_detection": {
       "z_pred": 1,
       "if_pred": 1,
       "hybrid_pred": 1,
       "z_proba": 0.85,
       "if_proba": 0.92,
       "hybrid_proba": 0.88,
       "anomaly_flag": true,
       "confidence": 0.88
     },
     "reason": "repeated major issues + worsening trend + anomalous pattern detected",
     "confidence": 0.88,
     "last_scores": [0.5, 1.2, 2.1, 3.0]
   }


3. GET /api/v1/pipeline/{school_id}
   Get pipeline results for ALL categories of a school
   
   Response:
   {
     "school_id": 101,
     "results": [
       {...},  // girls_toilet
       {...},  // boys_toilet
       {...}   // classroom
     ],
     "summary": {
       "Critical": 2,
       "Warning": 1,
       "Safe": 5
     }
   }


4. GET /api/v1/deo/queue
   ⭐ PRIMARY ENDPOINT FOR FRONTEND DASHBOARD
   Get priority maintenance queue for DEO (sorted by priority_score DESC)
   
   Response:
   [
     {
       "school_id": 101,
       "category": "girls_toilet",
       "status": "Critical",
       "risk_score": 2.3,
       "prediction": "30 days",
       "days_until_failure": 30,
       "priority_score": 11.5,  # 2.3 * 5.0 * 1.3 (anomaly boost)
       "anomaly_flag": true,
       "confidence": 0.88,
       "reason": "repeated major issues + worsening trend + anomalous pattern",
       "last_condition": "major"
     },
     {
       "school_id": 103,
       "category": "electrical",
       "status": "Warning",
       "risk_score": 1.4,
       "prediction": "45 days",
       "days_until_failure": 45,
       "priority_score": 4.9,
       "anomaly_flag": false,
       "confidence": 0.52,
       "reason": "worsening trend",
       "last_condition": "minor"
     }
   ]


5. GET /api/v1/deo/queue/{school_id}
   Get priority queue filtered for a specific school
   
   Response: [same as above but filtered]


6. GET /api/v1/pipeline/queue/priority
   Get ML-enhanced priority queue (alternative to deo/queue)
   Same structure as deo/queue with additional ML metrics


============================================================================
ML MODEL DETAILS
============================================================================

Z-SCORE DETECTOR:
- Computes z-score: |x - mean| / std
- Threshold: 2.0 (configurable)
- Detects sudden spikes or drops in condition scores
- Returns probability score [0, 1]

ISOLATION FOREST:
- Ensemble method for anomaly detection
- Contamination: 0.10 (10% expected outliers)
- n_estimators: 100 trees
- Captures complex patterns, not just outliers
- Returns anomaly probability [0, 1]

HYBRID MODEL:
- Combines: hybrid_proba = (z_proba + if_proba) / 2
- Prediction: 1 if hybrid_proba >= 0.5 else 0
- More robust than individual models
- Flag set if EITHER model detects anomaly

============================================================================
RESPONSE FIELD MEANINGS
============================================================================

risk_score: Average condition score (0-3 scale)
            0=Good, 1=Minor, 3=Major
            
status: Classification based on risk_score and anomaly
        Critical (2.0+), Warning (1.0+), Safe (<1.0)

prediction: Estimated failure timeline
            "30 days", "45 days", "60 days", or "Safe"

days_until_failure: Numeric days (30, 45, 60, or null)

trend: How condition is changing
       "worsening" (recent > early)
       "stable" (recent ≈ early)
       "improving" (recent < early)

rolling_mean: Average of last 3 scores

rolling_std: Standard deviation (volatility indicator)

anomaly_flag: True if Z-Score OR Isolation Forest detects anomaly

confidence: Hybrid model probability [0, 1]
            Higher = more certain it's an anomaly

priority_score: Ranking score for queue ordering
                category_weight * risk_score * anomaly_boost
                Used for DEO queue sorting

reason: Human-readable explanation combining all factors
        Examples:
        - "repeated major issues + worsening trend"
        - "anomalous pattern detected"
        - "critical risk level"

============================================================================
FRONTEND INTEGRATION GUIDE
============================================================================

RECOMMENDED APPROACH:

1. Fetch data:
   GET /api/v1/deo/queue

2. Parse response:
   for item in response:
       school_id = item["school_id"]
       category = item["category"]
       status = item["status"]
       priority = item["priority_score"]
       prediction = item["prediction"]
       reason = item["reason"]

3. Display:
   - Sort by priority_score DESC (highest first)
   - Color code: Red=Critical, Yellow=Warning, Green=Safe
   - Show prediction timeline (30/45/60 days)
   - Display reason as tooltip/detail
   - Highlight anomaly_flag if true (⚠️ symbol)
   - Show confidence as percentage

4. Actions:
   - Click item → show details (GET /pipeline/{school_id}/{category})
   - Create work order → POST /api/v1/work
   - Upload repair photo → POST /api/v1/report (new report)

EXAMPLE REACT CODE:

  const [queue, setQueue] = useState([]);
  
  useEffect(() => {
    fetch('/api/v1/deo/queue')
      .then(r => r.json())
      .then(data => {
        setQueue(data.sort((a, b) => b.priority_score - a.priority_score));
      });
  }, []);

  return (
    <div>
      {queue.map(item => (
        <div key={`${item.school_id}-${item.category}`} 
             className={`priority-card ${item.status.toLowerCase()}`}>
          <h3>School {item.school_id} - {item.category}</h3>
          <p>Status: {item.status}</p>
          <p>Priority: {item.priority_score.toFixed(2)}</p>
          <p>Prediction: {item.prediction}</p>
          {item.anomaly_flag && <span>⚠️ Anomaly Detected</span>}
          <p className="reason">{item.reason}</p>
        </div>
      ))}
    </div>
  );

============================================================================
QUICK START
============================================================================

1. Install dependencies:
   pip install -r requirements.txt

2. Load sample data:
   python load_sample_data.py

3. Start backend:
   python -m uvicorn app.main:app --reload

4. Run tests:
   python test_api.py

5. Access API:
   http://localhost:8000/docs (Swagger UI)
   http://localhost:8000/redoc (ReDoc)

============================================================================
CONFIGURATION
============================================================================

In utils.py, you can tune:

1. Contamination (IF anomaly threshold):
   hybrid_anomaly_detection(..., contamination=0.10)
   Range: 0.01-0.25

2. Z-Score threshold:
   hybrid_anomaly_detection(..., z_threshold=2.0)
   Range: 1.5-3.0

3. Risk classification:
   categorize_status(risk_score, anomaly_flag)
   Edit thresholds in function

4. Failure prediction:
   predict_failure(risk_score)
   Adjust day cutoffs as needed

5. Priority weights:
   calculate_priority_score()
   Modify category_weights dict

============================================================================
MONITORING
============================================================================

Database size: Reports table grows with new maintenance reports

Recommended checks:
- Monitor anomaly_flag distribution (too many = tuning needed)
- Check false positive rate (predictions vs actual failures)
- Compare confidence distribution across categories
- Track prediction accuracy over time

============================================================================
"""

# Print the documentation
if __name__ == "__main__":
    print(__doc__)
