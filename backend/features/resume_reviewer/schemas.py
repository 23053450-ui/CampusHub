from typing import List
from pydantic import BaseModel, Field


class ResumeReviewResponse(BaseModel):
    score: int = Field(..., ge=0, le=100, description="ATS Compatibility Score 0-100")
    summary: str
    strengths: List[str]
    improvements: List[str]
    suggestedKeywords: List[str]
