from pydantic import BaseModel, Field
from typing import Optional, List
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
    prediction: str
    reason: str
    priority_score: float
    risk_score: float
    days_until_failure: Optional[int]


class WorkOrderCreate(BaseModel):
    school_id: int
    category: str
    assigned_to: str


class WorkOrderResponse(WorkOrderCreate):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CompleteWorkRequest(BaseModel):
    work_id: int
    photo_url: str
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
