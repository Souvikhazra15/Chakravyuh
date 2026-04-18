from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..schemas import HistoryResponse

router = APIRouter(prefix="/api/v1/history", tags=["history"])


@router.get("/{school_id}", response_model=list[HistoryResponse])
async def get_repair_history(
    school_id: int,
    db = Depends(get_db),
):
    """Get complete repair history for a school."""
    categories = ["plumbing", "electrical", "structural"]
    history_data = []

    for category in categories:
        repairs = await db.repair.find_many(
            where={"school_id": school_id, "category": category},
            order_by={"completed_at": "desc"},
        )

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
    db = Depends(get_db),
):
    """Get repair history for a specific category."""
    repairs = await db.repair.find_many(
        where={"school_id": school_id, "category": category.lower()},
        order_by={"completed_at": "desc"},
    )

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
    db = Depends(get_db),
):
    """Get overall system statistics."""
    all_reports = await db.report.find_many()
    total_reports = len(all_reports)

    all_repairs = await db.repair.find_many()
    total_repairs = len(all_repairs)

    schools = set(report.school_id for report in all_reports) if all_reports else set()
    total_schools = len(schools)

    all_work_orders = await db.work_order.find_many()
    total_work_orders = len(all_work_orders)

    completed_orders = len([w for w in all_work_orders if w.status == "completed"])

    return {
        "total_reports": total_reports,
        "total_repairs": total_repairs,
        "total_schools": total_schools,
        "total_work_orders": total_work_orders,
        "completed_work_orders": completed_orders,
        "pending_work_orders": total_work_orders - completed_orders,
    }
