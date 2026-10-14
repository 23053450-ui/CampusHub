from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from features.subjects_ai.router import router as subjects_ai_router
from features.project_analysis.router import router as project_analysis_router
from features.resume_reviewer.router import router as resume_reviewer_router
from features.daily_quiz.router import router as daily_quiz_router
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    version: str

app = FastAPI(title="CampusHub API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1:1 Feature routers
app.include_router(subjects_ai_router, prefix="/api/v1")
app.include_router(project_analysis_router, prefix="/api/v1")
app.include_router(resume_reviewer_router, prefix="/api/v1")
app.include_router(daily_quiz_router, prefix="/api/v1")


@app.get("/api/v1/health", response_model=HealthResponse, tags=["health"])
async def health():
    return HealthResponse(status="ok", version="0.1.0")
