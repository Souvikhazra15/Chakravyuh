from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging

from ..database import get_db
from ..utils import calculate_priority_level

logger = logging.getLogger("app.chat")
router = APIRouter(prefix="/api/v1", tags=["chat"])


class ChatRequest(BaseModel):
    query: str


class ChatResponse(BaseModel):
    response: str


def _to_title(value: str) -> str:
    return str(value or "").replace("_", " ").title()


def _classify_query(query: str) -> str:
    q = query.lower().strip()

    if any(k in q for k in ["assigned", "contractor", "pending task", "my task", "pending"]):
        return "contractor"
    if any(k in q for k in ["how many", "overview", "summary", "total issues"]):
        return "summary"
    if any(k in q for k in ["why", "explain"]):
        return "explanation"
    if any(k in q for k in ["what should", "next", "prioritize", "suggested action", "action"]):
        return "action"
    if any(k in q for k in ["critical", "top", "high-risk", "high risk", "most"]):
        return "priority"

    return "unsupported"


async def _build_issue_rows(db) -> List[dict]:
    reports = await db.report.find_many(order={"timestamp": "desc"})

    latest_by_school_category = {}
    for row in reports:
        key = f"{row.school_id}:{row.category}"
        if key not in latest_by_school_category:
            latest_by_school_category[key] = row

    issue_rows = []
    for row in latest_by_school_category.values():
        risk_score = float(getattr(row, "condition_score", 0.5) or 0.5)
        priority_score, priority_level = calculate_priority_level(row.category, risk_score)
        reason = f"Risk score {risk_score:.2f} in {_to_title(row.category)} with {priority_level} priority"

        issue_rows.append({
            "school_id": row.school_id,
            "category": _to_title(row.category),
            "risk_score": risk_score,
            "priority_score": float(round(priority_score, 2)),
            "priority_level": priority_level,
            "days_to_failure": int(30 + (1 - risk_score) * 30),
            "reason": reason,
        })

    issue_rows.sort(key=lambda item: item["priority_score"], reverse=True)
    return issue_rows


@router.post("/chat", response_model=ChatResponse)
async def chat_assistant(payload: ChatRequest, db=Depends(get_db)):
    query = (payload.query or "").strip()
    if not query:
        logger.warning("Empty chat query received")
        return ChatResponse(response="Data not available")

    query_type = _classify_query(query)
    logger.info("📤 Chat query: type=%s query='%s'", query_type, query[:50])

    try:
        # Try to use cached analysis data first (from /analyze endpoint)
        from . import analyze as analyze_module
        cached_analysis = analyze_module.get_cached_analysis()
        
        issues = []
        if cached_analysis and cached_analysis.data:
            logger.info("✅ Using cached analysis data: %d issues", len(cached_analysis.data))
            issues = [
                {
                    "school_id": item.school_id,
                    "category": item.category,
                    "risk_score": item.risk_score,
                    "priority_score": item.priority_score,
                    "priority_level": item.priority_level,
                    "days_to_failure": item.days_to_failure,
                    "reason": item.reason,
                }
                for item in cached_analysis.data
            ]
        else:
            logger.info("⚠️ No cached analysis, falling back to database")
            issues = await _build_issue_rows(db)
        
        work_orders = await db.workorder.find_many(order={"created_at": "desc"})
        
        logger.info("📊 Chat data: %d issues, %d work orders", len(issues), len(work_orders))

        if query_type == "priority":
            top = issues[:5]
            if not top:
                logger.warning("❌ No issues found for priority query")
                return ChatResponse(response="Please run analysis first")
            lines = [
                f"- {item['school_id']} | {item['category']} | {item['priority_level']} | Score: {item['priority_score']}\n  Reason: {item['reason']}"
                for item in top
            ]
            response_text = "\n".join(lines)
            logger.info("✅ Priority response: %d critical issues", len(top))
            return ChatResponse(response=response_text)

        if query_type == "explanation":
            if not issues:
                logger.warning("❌ No issues found for explanation query")
                return ChatResponse(response="Please run analysis first")
            item = issues[0]
            lines = [
                f"School {item['school_id']} - {item['category']}:",
                f"  Risk Score: {item['risk_score']:.2f}",
                f"  Priority: {item['priority_level']}",
                f"  Days to Failure: {item['days_to_failure']}",
                f"  Analysis: {item['reason']}",
            ]
            response_text = "\n".join(lines)
            logger.info("✅ Explanation response for school %s", item['school_id'])
            return ChatResponse(response=response_text)

        if query_type == "summary":
            total = len(issues)
            critical = sum(1 for i in issues if i["priority_level"] == "Critical")
            high = sum(1 for i in issues if i["priority_level"] == "High")
            medium = sum(1 for i in issues if i["priority_level"] == "Medium")
            low = sum(1 for i in issues if i["priority_level"] == "Low")

            critical_pct = (critical / total * 100) if total > 0 else 0
            high_pct = (high / total * 100) if total > 0 else 0
            
            lines = [
                f"System Status: {total} total issues detected",
                f"  🔴 Critical: {critical} ({critical_pct:.0f}%)",
                f"  🟠 High: {high} ({high_pct:.0f}%)",
                f"  🟡 Medium: {medium}",
                f"  🟢 Low: {low}",
            ]
            response_text = "\n".join(lines)
            logger.info("✅ Summary response: total=%d critical=%d high=%d medium=%d low=%d", total, critical, high, medium, low)
            return ChatResponse(response=response_text)

        if query_type == "action":
            top = issues[:3]
            if not top:
                logger.warning("❌ No issues found for action query")
                return ChatResponse(response="Please run analysis first")

            lines = []
            for item in top:
                if item["priority_level"] == "Critical":
                    action = "🚨 Assign contractor TODAY"
                    days = "< 24 hours"
                elif item["priority_level"] == "High":
                    action = "⚠️ Schedule within 7 days"
                    days = f"{item['days_to_failure']} days"
                else:
                    action = "📋 Plan in next month"
                    days = f"{item['days_to_failure']} days"

                lines.append(
                    f"- {item['school_id']} | {item['category']} ({days})\n  {action}"
                )

            response_text = "\n".join(lines)
            logger.info("✅ Action response: %d recommendations", len(top))
            return ChatResponse(response=response_text)

        if query_type == "contractor":
            if not work_orders:
                logger.warning("❌ No work orders found for contractor query")
                return ChatResponse(response="No active work orders")

            q_lower = query.lower()
            filtered = work_orders
            if "pending" in q_lower:
                filtered = [w for w in filtered if str(getattr(w, "status", "")).lower() == "pending"]
            elif "in progress" in q_lower:
                filtered = [w for w in filtered if str(getattr(w, "status", "")).lower() == "in progress"]
            elif "completed" in q_lower:
                filtered = [w for w in filtered if str(getattr(w, "status", "")).lower() == "completed"]

            if not filtered:
                logger.warning("❌ No matching work orders found")
                return ChatResponse(response="No work orders with that status")

            lines = []
            for w in filtered[:10]:
                status_icon = "✅" if str(getattr(w, "status", "")).lower() == "completed" else "⏳" if str(getattr(w, "status", "")).lower() == "in progress" else "📝"
                lines.append(
                    f"{status_icon} School {w.school_id} | {_to_title(w.category)}\n   Contractor: {getattr(w, 'assigned_to', 'Unassigned')} | Status: {w.status}"
                )
            response_text = "\n".join(lines)
            logger.info("✅ Contractor response: %d work orders", len(filtered))
            return ChatResponse(response=response_text)

        logger.warning("❌ Unsupported query type: %s", query_type)
        return ChatResponse(response="I can help with: priorities, explanations, summary, actions, or work orders. Try 'Top critical issues' or 'System summary'")

    except Exception as e:
        logger.exception("❌ Chat error: %s", str(e))
        import traceback
        traceback.print_exc()
        return ChatResponse(response="Error processing query. Please try again or run analysis first.")
