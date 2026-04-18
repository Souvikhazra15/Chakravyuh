from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..database import get_db
from ..models import Report, Repair, WorkOrder
from ..schemas import HistoryResponse

router = APIRouter(prefix="/api/v1/history", tags=["history"])


@router.get("/{school_id}", response_model=list[HistoryResponse])
async def get_repair_history(
    school_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get complete repair history for a school."""
    categories = ["plumbing", "electrical", "structural"]
    history_data = []

    for category in categories:
        result = await db.execute(
            select(Repair)
            .where(Repair.school_id == school_id, Repair.category == category)
            .order_by(Repair.completed_at.desc())
        )
        repairs = result.scalars().all()

        if not repairs:
            history_data.append(
                HistoryResponse(
                    school_id=school_id,
                    category=category,
                    past_issues=[],
                    repair_count=0,
                    last_repair_date=None,
                )
            )
            continue

        past_issues = [
            {
                "date": repair.completed_at.isoformat(),
                "photo_url": repair.photo_url,
                "notes": repair.notes,
                "location": repair.gps_location,
            }
            for repair in repairs
        ]

        history_data.append(
            HistoryResponse(
                school_id=school_id,
                category=category,
                past_issues=past_issues,
                repair_count=len(repairs),
                last_repair_date=repairs[0].completed_at,
            )
        )

    return history_data


@router.get("/{school_id}/{category}", response_model=HistoryResponse)
async def get_category_history(
    school_id: int,
    category: str,
    db: AsyncSession = Depends(get_db),
):
    """Get repair history for a specific category."""
    result = await db.execute(
        select(Repair)
        .where(Repair.school_id == school_id, Repair.category == category.lower())
        .order_by(Repair.completed_at.desc())
    )
    repairs = result.scalars().all()

    if not repairs:
        return HistoryResponse(
            school_id=school_id,
            category=category,
            past_issues=[],
            repair_count=0,
            last_repair_date=None,
        )

    past_issues = [
        {
            "date": repair.completed_at.isoformat(),
            "photo_url": repair.photo_url,
            "notes": repair.notes,
            "location": repair.gps_location,
        }
        for repair in repairs
    ]

    return HistoryResponse(
        school_id=school_id,
        category=category,
        past_issues=past_issues,
        repair_count=len(repairs),
        last_repair_date=repairs[0].completed_at,
    )


@router.get("/", response_model=dict)
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get overall system statistics."""
    report_count = await db.execute(select(func.count(Report.id)))
    total_reports = report_count.scalar() or 0

    repair_count = await db.execute(select(func.count(Repair.id)))
    total_repairs = repair_count.scalar() or 0

    school_count = await db.execute(select(func.count(func.distinct(Report.school_id))))
    total_schools = school_count.scalar() or 0

    work_count = await db.execute(select(func.count(WorkOrder.id)))
    total_work_orders = work_count.scalar() or 0

    completed_count = await db.execute(
        select(func.count(WorkOrder.id)).where(WorkOrder.status == "completed")
    )
    completed_orders = completed_count.scalar() or 0

    return {
        "total_reports": total_reports,
        "total_repairs": total_repairs,
        "total_schools": total_schools,
        "total_work_orders": total_work_orders,
        "completed_work_orders": completed_orders,
        "pending_work_orders": total_work_orders - completed_orders,
    }
