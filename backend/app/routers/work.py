from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import Optional
import re
from ..database import get_db
from ..schemas import (
    WorkOrderAssignRequest,
    WorkOrderCreate,
    WorkOrderResponse,
    WorkOrderStatusResponse,
    CompleteWorkRequest,
    RepairResponse,
)

router = APIRouter(prefix="/api/v1/work", tags=["work-orders"])
work_orders_router = APIRouter(prefix="/api/v1/work-orders", tags=["work-orders"])
assign_router = APIRouter(prefix="/api/v1", tags=["work-orders"])


def normalize_school_id(value: str) -> int:
    match = re.search(r"\d+", value or "")
    if match:
        return int(match.group(0))
    return 0


def serialize_work_order(work_order) -> dict:
    return {
        "id": work_order.id,
        "school_id": work_order.school_id,
        "category": work_order.category,
        "issue": getattr(work_order, "issue", None),
        "priority_score": getattr(work_order, "priority_score", None),
        "priority_level": getattr(work_order, "priority_level", None),
        "assigned_contractor": getattr(work_order, "assigned_to", ""),
        "status": work_order.status,
        "photo_url": getattr(work_order, "photo_url", None),
        "gps_location": getattr(work_order, "gps_location", None),
        "created_at": work_order.created_at,
        "completed_at": work_order.completed_at,
    }


@assign_router.post("/assign", response_model=WorkOrderResponse)
async def assign_work_order(
    work_data: WorkOrderAssignRequest,
    db = Depends(get_db),
):
    school_id = normalize_school_id(work_data.school_id)
    db_work = await db.workorder.create(
        data={
            "school_id": school_id,
            "category": work_data.category.lower(),
            "issue": work_data.issue,
            "priority_score": work_data.priority_score,
            "priority_level": work_data.priority_level,
            "assigned_to": work_data.assigned_contractor,
            "status": "Pending",
        }
    )

    return WorkOrderResponse(**serialize_work_order(db_work))


@router.post("/order", response_model=WorkOrderResponse)
async def create_work_order(
    work_data: WorkOrderCreate,
    db = Depends(get_db),
):
    """
    Create a new work order for maintenance.
    
    - **school_id**: ID of the school
    - **category**: Maintenance category
    - **assigned_to**: Contractor/person assigned
    """
    school_id = normalize_school_id(work_data.school_id)
    db_work = await db.workorder.create(
        data={
            "school_id": school_id,
            "category": work_data.category.lower(),
            "issue": work_data.issue,
            "priority_score": work_data.priority_score,
            "priority_level": work_data.priority_level,
            "assigned_to": work_data.assigned_contractor,
            "status": "Pending",
        }
    )

    return WorkOrderResponse(**serialize_work_order(db_work))


@assign_router.post("/complete-work", response_model=WorkOrderStatusResponse)
async def complete_work(
    completion_data: CompleteWorkRequest,
    db = Depends(get_db),
):
    """
    Mark a work order as complete with repair details.
    
    - **work_id**: ID of the work order
    - **photo_url**: Photo proof of completion
    - **gps_location**: GPS coordinates (optional)
    - **notes**: Additional notes (optional)
    """
    work_order = await db.workorder.find_unique(
        where={"id": completion_data.work_id}
    )

    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    await db.repair.create(
        data={
            "work_order_id": work_order.id,
            "school_id": work_order.school_id,
            "category": work_order.category,
            "photo_url": completion_data.photo_url or "",
            "gps_location": completion_data.gps_location,
            "notes": completion_data.notes,
            "completed_at": datetime.utcnow(),
        }
    )

    updated = await db.workorder.update(
        where={"id": completion_data.work_id},
        data={
            "status": "Completed",
            "completed_at": datetime.utcnow(),
            "photo_url": completion_data.photo_url,
            "gps_location": completion_data.gps_location,
        },
    )

    return WorkOrderStatusResponse(
        id=updated.id,
        status=updated.status,
        completed_at=updated.completed_at,
    )


@router.get("/order/{work_id}", response_model=WorkOrderResponse)
async def get_work_order(
    work_id: int,
    db = Depends(get_db),
):
    """Get details of a specific work order."""
    work_order = await db.workorder.find_unique(where={"id": work_id})

    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    return WorkOrderResponse(**serialize_work_order(work_order))


@router.get("/school/{school_id}", response_model=list[WorkOrderResponse])
async def get_work_orders_for_school(
    school_id: int,
    db = Depends(get_db),
):
    """Get all work orders for a school."""
    work_orders = await db.workorder.find_many(
        where={"school_id": school_id},
    )

    return [WorkOrderResponse(**serialize_work_order(wo)) for wo in work_orders]


@router.get("", response_model=list[WorkOrderResponse])
async def get_all_work_orders(
    db = Depends(get_db),
):
    """Get all work orders."""
    work_orders = await db.workorder.find_many(
    )

    return [WorkOrderResponse(**serialize_work_order(wo)) for wo in work_orders]


# Alias endpoint for /api/v1/work-orders
@work_orders_router.get("", response_model=list[WorkOrderResponse])
async def get_all_work_orders_alias(
    contractor: Optional[str] = None,
    db = Depends(get_db),
):
    """Get all work orders (optionally filtered by contractor)."""
    where = {"assigned_to": contractor} if contractor else None
    work_orders = await db.workorder.find_many(
        where=where,
    )
    return [WorkOrderResponse(**serialize_work_order(wo)) for wo in work_orders]


@work_orders_router.get("/{work_id}", response_model=WorkOrderResponse)
async def get_work_order_alias(
    work_id: int,
    db = Depends(get_db),
):
    """Get details of a specific work order."""
    work_order = await db.workorder.find_unique(where={"id": work_id})

    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    return WorkOrderResponse(**serialize_work_order(work_order))


@work_orders_router.post("/{work_id}/start", response_model=WorkOrderStatusResponse)
async def start_work_order(
    work_id: int,
    db = Depends(get_db),
):
    work_order = await db.work_order.find_unique(where={"id": work_id})
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    updated = await db.workorder.update(
        where={"id": work_id},
        data={"status": "In Progress"},
    )

    return WorkOrderStatusResponse(id=updated.id, status=updated.status)


@router.get("/pending", response_model=list[WorkOrderResponse])
async def get_pending_work_orders(
    db = Depends(get_db),
):
    """Get all pending work orders."""
    work_orders = await db.workorder.find_many(
        where={"status": "Pending"},
    )

    return [WorkOrderResponse(**serialize_work_order(wo)) for wo in work_orders]


@router.get("/completed", response_model=list[RepairResponse])
async def get_completed_repairs(
    db = Depends(get_db),
):
    """Get all completed repairs."""
    repairs = await db.repair.find_many(
    )

    return repairs
