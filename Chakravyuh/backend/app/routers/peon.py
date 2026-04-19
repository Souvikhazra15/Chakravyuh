from fastapi import APIRouter, HTTPException, status, File, UploadFile, Form
from typing import Optional
import os
import logging

logger = logging.getLogger("app.peon")

router = APIRouter(prefix="/api/v1", tags=["peon"])

# Directory to store uploaded files
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "peon_submissions")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/peon/submit-file")
async def submit_peon_file(
    school_id: int = Form(...),
    category: str = Form(...),
    condition: str = Form(...),
    submitted_by: str = Form(...),
    notes: str = Form(default=""),
    file: UploadFile = File(None)  # Make file optional
):
    """
    Handle file submission from peons (CSV or PDF).
    Stores the file and returns file info for principal access.
    """
    try:
        # If no file provided, return success
        if not file or file.size == 0:
            logger.info(f"No file provided, skipping file upload")
            return {
                "status": "success",
                "message": "Submission recorded (no file uploaded)",
                "school_id": school_id,
                "category": category,
                "submitted_by": submitted_by
            }

        # Validate file type
        allowed_types = ["text/csv", "application/pdf", "image/jpeg", "image/png"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: CSV, PDF, JPG, PNG. Got: {file.content_type}"
            )

        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        file_content = await file.read()
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max size: 10MB"
            )

        if len(file_content) == 0:
            logger.info(f"Empty file provided, skipping upload")
            return {
                "status": "success",
                "message": "Submission recorded (empty file)",
                "school_id": school_id,
                "category": category,
                "submitted_by": submitted_by
            }

        # Create unique filename
        file_ext = ".csv" if file.content_type == "text/csv" else \
                   ".pdf" if file.content_type == "application/pdf" else \
                   ".jpg" if file.content_type == "image/jpeg" else ".png"
        filename = f"{school_id}_{category}_{submitted_by.replace(' ', '_')}_{file.filename.split('.')[0]}{file_ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        # Save file
        with open(filepath, "wb") as f:
            f.write(file_content)

        logger.info(f"File saved: {filename} from {submitted_by}")

        return {
            "status": "success",
            "filename": filename,
            "original_name": file.filename,
            "school_id": school_id,
            "category": category,
            "submitted_by": submitted_by,
            "file_path": filepath,
            "content_type": file.content_type,
            "size": len(file_content)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error saving file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving file: {str(e)}"
        )


@router.get("/peon/submitted-files")
async def get_submitted_files():
    """
    List all submitted files by peons for principal to access.
    """
    try:
        if not os.path.exists(UPLOAD_DIR):
            return {"files": []}

        files = []
        for filename in os.listdir(UPLOAD_DIR):
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(filepath):
                file_stat = os.stat(filepath)
                files.append({
                    "filename": filename,
                    "original_name": filename.split('_', 3)[-1],  # Extract original name
                    "size": file_stat.st_size,
                    "uploaded_at": file_stat.st_mtime,
                    "file_type": "csv" if filename.endswith(".csv") else "pdf"
                })

        # Sort by upload time (newest first)
        files.sort(key=lambda x: x["uploaded_at"], reverse=True)

        return {"files": files}

    except Exception as e:
        logger.exception(f"Error listing files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing files: {str(e)}"
        )


@router.get("/peon/submitted-files/{filename}")
async def get_submitted_file(filename: str):
    """
    Get content of a submitted file for analysis.
    """
    try:
        filepath = os.path.join(UPLOAD_DIR, filename)

        # Security: prevent path traversal
        if not os.path.abspath(filepath).startswith(os.path.abspath(UPLOAD_DIR)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        if not os.path.exists(filepath):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found: {filename}"
            )

        # Read file content
        with open(filepath, "rb") as f:
            content = f.read()

        # If CSV, parse and return as JSON
        if filename.endswith(".csv"):
            import csv
            import io
            
            text_content = content.decode("utf-8")
            csv_reader = csv.DictReader(io.StringIO(text_content))
            rows = list(csv_reader)
            
            return {
                "filename": filename,
                "file_type": "csv",
                "rows": rows,
                "row_count": len(rows)
            }

        # For PDF, return file info
        return {
            "filename": filename,
            "file_type": "pdf",
            "size": len(content),
            "message": "PDF file - download required for analysis"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error reading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading file: {str(e)}"
        )
