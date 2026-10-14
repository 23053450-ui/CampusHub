from typing import List
from pydantic import BaseModel, Field


class ProjectAnalysisRequest(BaseModel):
    github_url: str = Field(..., description="Public GitHub repository URL")


class ProjectAnalysisResponse(BaseModel):
    repositoryName: str
    techStack: List[str]
    architectureSummary: str
    strengths: List[str]
    criticalIssues: List[str]
    recommendations: List[str]
