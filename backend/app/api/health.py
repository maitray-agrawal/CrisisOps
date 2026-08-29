from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health Check"])


@router.get("/health")
def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENV
    }
