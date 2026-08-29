from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import SOPDocument
from app.schemas.schemas import SOPDocumentResponse

router = APIRouter(prefix="/sops", tags=["SOP Knowledge Repository"])


@router.get("", response_model=List[SOPDocumentResponse])
def get_sops(db: Session = Depends(get_db)):
    """List all available Standard Operating Procedure (SOP) documents."""
    return db.query(SOPDocument).order_by(SOPDocument.sop_code.asc()).all()


@router.get("/{sop_id}", response_model=SOPDocumentResponse)
def get_sop_by_id(sop_id: str, db: Session = Depends(get_db)):
    """Fetch details and full markdown text for a specific SOP document."""
    sop = db.query(SOPDocument).filter(
        (SOPDocument.id == sop_id) | (SOPDocument.sop_code == sop_id)
    ).first()
    if not sop:
        raise HTTPException(status_code=404, detail=f"SOP Document '{sop_id}' not found")
    return sop
