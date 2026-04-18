from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/principal", tags=["principal"])


class SubmissionResponse(BaseModel):
    id: int
    submission_id: str
    school_id: int
    category: str
    condition: str
    submitted_by: str
    date: datetime
    status: str

    class Config:
        from_attributes = True


class SubmissionCreate(BaseModel):
    school_id: int
    category: str
    condition: str
    submitted_by: str


@router.get("/submissions", response_model=List[SubmissionResponse])
async def get_submissions(
    school_id: Optional[int] = None,
    submission_status: Optional[str] = None,
    db = Depends(get_db),
):
    """Get all submissions for a school."""
    try:
        where_clause = {}
        if school_id:
            where_clause["school_id"] = school_id
        if submission_status:
            where_clause["status"] = submission_status

        submissions = await db.submission.find_many(
            where=where_clause if where_clause else None,
        )
        return submissions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching submissions: {str(e)}",
        )


@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: str,
    db = Depends(get_db),
):
    """Get a specific submission."""
    try:
        submission = await db.submission.find_unique(
            where={"submission_id": submission_id}
        )
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )
        return submission
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching submission: {str(e)}",
        )


@router.post("/submissions", response_model=SubmissionResponse)
async def create_submission(
    submission_data: SubmissionCreate,
    db = Depends(get_db),
):
    """Create a new submission from a peon."""
    try:
        # Generate submission_id
        import uuid
        submission_id = f"SUB{uuid.uuid4().hex[:8].upper()}"

        submission = await db.submission.create(
            data={
                "submission_id": submission_id,
                "school_id": submission_data.school_id,
                "category": submission_data.category.lower(),
                "condition": submission_data.condition,
                "submitted_by": submission_data.submitted_by,
                "status": "pending",
                "date": datetime.utcnow(),
            }
        )
        return submission
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating submission: {str(e)}",
        )


@router.post("/approve/{submission_id}")
async def approve_submission(
    submission_id: str,
    verified_by: Optional[int] = None,
    db = Depends(get_db),
):
    """Approve a submission for predictions."""
    try:
        submission = await db.submission.find_unique(
            where={"submission_id": submission_id}
        )
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )

        updated = await db.submission.update(
            where={"submission_id": submission_id},
            data={
                "status": "verified",
                "verified_at": datetime.utcnow(),
                "verified_by": verified_by,
            },
        )
        return {
            "message": "Submission approved",
            "submission_id": submission_id,
            "status": updated.status,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving submission: {str(e)}",
        )


@router.post("/reject/{submission_id}")
async def reject_submission(
    submission_id: str,
    verified_by: Optional[int] = None,
    db = Depends(get_db),
):
    """Reject a submission."""
    try:
        submission = await db.submission.find_unique(
            where={"submission_id": submission_id}
        )
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found",
            )

        updated = await db.submission.update(
            where={"submission_id": submission_id},
            data={
                "status": "rejected",
                "verified_at": datetime.utcnow(),
                "verified_by": verified_by,
            },
        )
        return {
            "message": "Submission rejected",
            "submission_id": submission_id,
            "status": updated.status,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error rejecting submission: {str(e)}",
        )
