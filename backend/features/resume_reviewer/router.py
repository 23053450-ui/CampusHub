from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile
from core.security import get_current_user
from core.rate_limit import rate_limit
from features.resume_reviewer.schemas import ResumeReviewResponse
from features.resume_reviewer.service import ResumeReviewerService

router = APIRouter(
    prefix="/resume-reviewer",
    tags=["resume-reviewer"],
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=3600))],
)


@router.post("/review", response_model=ResumeReviewResponse)
async def review_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
):
    """ATS resume evaluation using Gemini."""
    return await ResumeReviewerService.review(file=file, target_role=target_role)
