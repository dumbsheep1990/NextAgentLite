"""
File upload endpoints for papers.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
import aiofiles
from pathlib import Path

from db.database import get_db
from core.logger import logger
from core.config_optimized import optimized_config_manager
from models.paper import Paper

router = APIRouter()


class UploadResponse(BaseModel):
    """Response model for file upload."""
    file_id: str
    filename: str
    file_size: int
    status: str
    message: str


@router.post("/papers", response_model=UploadResponse)
async def upload_paper(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a research paper file for processing.
    """
    try:
        # Validate file type
        file_extension = Path(file.filename).suffix.lower().lstrip('.')
        allowed_types = ["pdf", "docx", "txt"]  # Default allowed types
        if file_extension not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Supported types: {', '.join(allowed_types)}"
            )
        
        # Check file content
        content = await file.read()
        max_size = 10485760  # 10MB default
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {max_size} bytes"
            )
        
        # Generate unique file ID and path
        file_id = str(uuid.uuid4())
        upload_dir = "./uploads"  # Default upload directory
        file_path = Path(upload_dir) / f"{file_id}_{file.filename}"
        
        # Ensure upload directory exists
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Create paper record
        paper = Paper(
            title=f"Uploaded: {file.filename}",
            authors="To be extracted",
            file_path=str(file_path),
            file_size=len(content),
            processed="pending"
        )
        db.add(paper)
        await db.commit()
        
        logger.info(f"File uploaded successfully: {file.filename}")
        
        return UploadResponse(
            file_id=file_id,
            filename=file.filename,
            file_size=len(content),
            status="uploaded",
            message="File uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}") 