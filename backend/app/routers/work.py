from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from ..database import get_db
from ..models import WorkOrder, Repair, Report
from ..schemas import WorkOrderCreate, WorkOrderResponse, CompleteWorkRequest, RepairResponse

router = APIRouter(prefix="/api/v1/work", tags=["work-orders"])


@router.post("/order", response_model=WorkOrderResponse)
async def create_work_order(
    work_data: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new work order for maintenance.
    
    - **school_id**: ID of the school
    - **category**: Maintenance category
    - **assigned_to**: Contractor/person assigned
    """
    db_work = WorkOrder(
        school_id=work_data.school_id,
        category=work_data.category.lower(),
        assigned_to=work_data.assigned_to,
        status="pending",
    )

    db.add(db_work)
    await db.commit()
    await db.refresh(db_work)

    return db_work


@router.post("/complete", response_model=RepairResponse)
async def complete_work(
    completion_data: CompleteWorkRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a work order as complete with repair details.
    
    - **work_id**: ID of the work order
    - **photo_url**: Photo proof of completion
    - **gps_location**: GPS coordinates (optional)
    - **notes**: Additional notes (optional)
    """
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == completion_data.work_id))
    work_order = result.scalar_one_or_none()

    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    db_repair = Repair(
        work_order_id=work_order.id,
        school_id=work_order.school_id,
        category=work_order.category,
        photo_url=completion_data.photo_url,
        gps_location=completion_data.gps_location,
        notes=completion_data.notes,
        completed_at=datetime.utcnow(),
    )

    await db.execute(
        update(WorkOrder)
        .where(WorkOrder.id == completion_data.work_id)
        .values(status="completed", completed_at=datetime.utcnow())
    )

    db.add(db_repair)
    await db.commit()
    await db.refresh(db_repair)

    return db_repair


@router.get("/order/{work_id}", response_model=WorkOrderResponse)
async def get_work_order(
    work_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific work order."""
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == work_id))
    work_order = result.scalar_one_or_none()

    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    return work_order


@router.get("/school/{school_id}", response_model=list[WorkOrderResponse])
async def get_work_orders_for_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get all work orders for a school."""
    result = await db.execute(
        select(WorkOrder)
        .where(WorkOrder.school_id == school_id)
        .order_by(WorkOrder.created_at.desc())
    )
    work_orders = result.scalars().all()

    return work_orders


@router.get("/pending", response_model=list[WorkOrderResponse])
async def get_pending_work_orders(
    db: AsyncSession = Depends(get_db),
):
    """Get all pending work orders."""
    result = await db.execute(
        select(WorkOrder)
        .where(WorkOrder.status == "pending")
        .order_by(WorkOrder.created_at.desc())
    )
    work_orders = result.scalars().all()

    return work_orders


@router.get("/completed", response_model=list[RepairResponse])
async def get_completed_repairs(
    db: AsyncSession = Depends(get_db),
):
    """Get all completed repairs."""
    result = await db.execute(select(Repair).order_by(Repair.completed_at.desc()))
    repairs = result.scalars().all()

    return repairs
