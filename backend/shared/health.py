"""
Health check route and response schema.
Owner: Core Platform Team
"""

from fastapi import APIRouter
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    version: str


router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health():
    return HealthResponse(status="ok", version="0.1.0")
