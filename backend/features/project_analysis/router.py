from fastapi import APIRouter, Depends
from core.security import get_current_user
from core.rate_limit import rate_limit
from features.project_analysis.schemas import (
    ProjectAnalysisRequest,
    ProjectAnalysisResponse,
)
from features.project_analysis.service import ProjectAnalysisService

router = APIRouter(
    prefix="/project-analysis",
    tags=["project-analysis"],
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=3600))],
)


@router.post("/analyze", response_model=ProjectAnalysisResponse)
async def analyze_project(
    body: ProjectAnalysisRequest,
    user: dict = Depends(get_current_user),
):
    """GitHub repository architecture and code audit using Gemini."""
    return await ProjectAnalysisService.analyze(github_url=body.github_url)
