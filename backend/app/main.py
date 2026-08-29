from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.db.seed import seed_database_if_empty
from app.api import health, machines, incidents, sops, simulation, investigation, audit

# Create Database tables automatically on startup if not present
Base.metadata.create_all(bind=engine)

# Idempotent demo database seeding for clean deployment
with SessionLocal() as db_session:
    seed_database_if_empty(db_session)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Industrial CrisisOps API — AI-Powered Incident Investigation & Response Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS Middleware for local development and Render production
cors_origins = [str(o) for o in settings.CORS_ORIGINS]
allow_creds = False if "*" in cors_origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_creds,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(machines.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(sops.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(investigation.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)



@app.get("/")
def root():
    """Root redirect / information endpoint."""
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
