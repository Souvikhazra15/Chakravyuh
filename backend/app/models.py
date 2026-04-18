from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, index=True)
    category = Column(String, index=True)
    condition = Column(String)
    condition_score = Column(Float)
    photo_url = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    work_orders = relationship("WorkOrder", back_populates="report")


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, index=True)
    category = Column(String, index=True)
    assigned_to = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)

    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    report = relationship("Report", back_populates="work_orders")

    repairs = relationship("Repair", back_populates="work_order")


class Repair(Base):
    __tablename__ = "repairs"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"))
    school_id = Column(Integer, index=True)
    category = Column(String, index=True)
    photo_url = Column(String)
    gps_location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, default=datetime.utcnow, index=True)

    work_order = relationship("WorkOrder", back_populates="repairs")
