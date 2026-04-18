from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from ..database import get_db
from ..schemas import WorkOrderCreate, WorkOrderResponse, CompleteWorkRequest, RepairResponse

router = APIRouter(prefix="/api/v1/work", tags=["work-orders"])


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
    db_work = await db.work_order.create(
        data={
            "school_id": work_data.school_id,
            "category": work_data.category.lower(),
            "assigned_to": work_data.assigned_to,
            "status": "pending",
        }
    )

    return db_work


@router.post("/complete", response_model=RepairResponse)
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
    work_order = await db.work_order.find_unique(
        where={"id": completion_data.work_id}
    )

    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    db_repair = await db.repair.create(
        data={
            "work_order_id": work_order.id,
            "school_id": work_order.school_id,
            "category": work_order.category,
            "photo_url": completion_data.photo_url,
            "gps_location": completion_data.gps_location,
            "notes": completion_data.notes,
            "completed_at": datetime.utcnow(),
        }
    )

    await db.work_order.update(
        where={"id": completion_data.work_id},
        data={"status": "completed", "completed_at": datetime.utcnow()},
    )

    return db_repair


@router.get("/order/{work_id}", response_model=WorkOrderResponse)
async def get_work_order(
    work_id: int,
    db = Depends(get_db),
):
    """Get details of a specific work order."""
    work_order = await db.work_order.find_unique(where={"id": work_id})

    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    return work_order


@router.get("/school/{school_id}", response_model=list[WorkOrderResponse])
async def get_work_orders_for_school(
    school_id: int,
    db = Depends(get_db),
):
    """Get all work orders for a school."""
    work_orders = await db.work_order.find_many(
        where={"school_id": school_id},
        order_by={"created_at": "desc"},
    )

    return work_orders


@router.get("/pending", response_model=list[WorkOrderResponse])
async def get_pending_work_orders(
    db = Depends(get_db),
):
    """Get all pending work orders."""
    work_orders = await db.work_order.find_many(
        where={"status": "pending"},
        order_by={"created_at": "desc"},
    )

    return work_orders


@router.get("/completed", response_model=list[RepairResponse])
async def get_completed_repairs(
    db = Depends(get_db),
):
    """Get all completed repairs."""
    repairs = await db.repair.find_many(
        order_by={"completed_at": "desc"}
    )

    return repairs
