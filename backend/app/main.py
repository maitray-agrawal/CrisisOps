from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import health, machines, incidents, sops

# Create Database tables automatically on startup if not present
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Industrial CrisisOps API — AI-Powered Incident Investigation & Response Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS Middleware for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(machines.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(sops.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    """Root redirect / information endpoint."""
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
