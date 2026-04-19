from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class ReportCreate(BaseModel):
    school_id: int
    category: str = Field(..., description="plumbing, electrical, or structural")
    condition: str = Field(..., description="Good, Minor, or Major")
    photo_url: Optional[str] = None


class ReportResponse(ReportCreate):
    id: int
    condition_score: float
    timestamp: datetime

    class Config:
        from_attributes = True


class RiskData(BaseModel):
    category: str
    risk_score: float
    trend: str
    last_scores: List[float]


class PredictionResponse(BaseModel):
    category: str
    prediction: str
    days_until_failure: Optional[int]
    reason: str
    risk_score: float


class ExplainResponse(BaseModel):
    category: str
    explanation: str
    last_4_scores: List[float]
    trend: str
    risk_score: float


class DEOQueueItem(BaseModel):
    school_id: int
    category: str
    status: str = Field(..., description="Critical, Warning, or Safe")
    risk_score: float
    prediction: str
    days_until_failure: Optional[int]
    priority_score: float
    anomaly_flag: bool
    confidence: float
    reason: str
    last_condition: str = Field(..., description="Most recent condition (Good, Minor, Major)")


# ============================================================================
# HYBRID ML PIPELINE RESPONSE SCHEMAS
# ============================================================================

class AnomalyDetectionResult(BaseModel):
    """Result from Z-Score + Isolation Forest hybrid detection."""
    z_pred: int = Field(..., description="Z-Score prediction (0=normal, 1=anomaly)")
    if_pred: int = Field(..., description="Isolation Forest prediction (0=normal, 1=anomaly)")
    hybrid_pred: int = Field(..., description="Hybrid prediction (0=normal, 1=anomaly)")
    z_proba: float = Field(..., description="Z-Score anomaly probability [0, 1]")
    if_proba: float = Field(..., description="Isolation Forest anomaly probability [0, 1]")
    hybrid_proba: float = Field(..., description="Hybrid anomaly probability [0, 1]")
    anomaly_flag: bool = Field(..., description="True if any model detects anomaly")
    confidence: float = Field(..., description="Confidence score [0, 1]")


class PipelineResult(BaseModel):
    """Complete pipeline result for a school-category combination."""
    school_id: int
    category: str
    risk_score: float = Field(..., description="Average condition score")
    status: str = Field(..., description="Critical, Warning, or Safe")
    prediction: str = Field(..., description="Failure timeline (30/45/60 days or Safe)")
    days_until_failure: Optional[int] = Field(None, description="Expected days until failure")
    trend: str = Field(..., description="worsening, stable, or improving")
    rolling_mean: float = Field(..., description="Rolling average of last 3 scores")
    rolling_std: float = Field(..., description="Rolling standard deviation")
    anomaly_detection: AnomalyDetectionResult
    reason: str = Field(..., description="Explanation for prediction")
    confidence: float = Field(..., description="Overall confidence [0, 1]")
    last_scores: List[float] = Field(..., description="Last condition scores")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PipelineQueueItem(BaseModel):
    """Item for DEO maintenance priority queue."""
    school_id: int
    category: str
    status: str = Field(..., description="Critical, Warning, or Safe")
    risk_score: float
    prediction: str
    days_until_failure: Optional[int]
    priority_score: float
    anomaly_flag: bool
    confidence: float
    reason: str
    last_condition: str = Field(..., description="Most recent condition (Good, Minor, Major)")


class BulkPipelineResponse(BaseModel):
    """Bulk results for all categories of a school."""
    school_id: int
    results: List[PipelineResult]
    summary: Dict[str, int] = Field(..., description="Count of Critical/Warning/Safe")
    
    class Config:
        json_schema_extra = {
            "example": {
                "school_id": 101,
                "results": [],
                "summary": {"Critical": 2, "Warning": 1, "Safe": 5}
            }
        }


class WorkOrderAssignRequest(BaseModel):
    school_id: str
    category: str
    priority_score: Optional[float] = None
    priority_level: Optional[str] = None
    assigned_contractor: str
    issue: Optional[str] = None


class WorkOrderCreate(BaseModel):
    school_id: str
    category: str
    assigned_contractor: str
    priority_score: Optional[float] = None
    priority_level: Optional[str] = None
    issue: Optional[str] = None


class WorkOrderResponse(BaseModel):
    id: int
    school_id: int
    category: str
    issue: Optional[str] = None
    priority_score: Optional[float] = None
    priority_level: Optional[str] = None
    assigned_contractor: str
    status: str
    photo_url: Optional[str] = None
    gps_location: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkOrderStatusResponse(BaseModel):
    id: int
    status: str
    completed_at: Optional[datetime] = None


class CompleteWorkRequest(BaseModel):
    work_id: int
    photo_url: Optional[str] = None
    gps_location: Optional[str] = None
    notes: Optional[str] = None


class RepairResponse(BaseModel):
    id: int
    school_id: int
    category: str
    photo_url: str
    gps_location: Optional[str]
    notes: Optional[str]
    completed_at: datetime

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    school_id: int
    category: str
    past_issues: List[dict]
    repair_count: int
    last_repair_date: Optional[datetime]


class SchoolRiskSummary(BaseModel):
    school_id: int
    plumbing_risk: float
    electrical_risk: float
    structural_risk: float
    highest_risk_category: str
    highest_risk_score: float
