from typing import List
from fastapi import APIRouter, Depends
from core.security import get_current_user
from core.rate_limit import rate_limit
from features.daily_quiz.schemas import (
    DailyQuizQuestion,
    DailyQuizSubmission,
    DailyQuizResult,
)
from features.daily_quiz.service import DailyQuizService

router = APIRouter(
    prefix="/daily-quiz",
    tags=["daily-quiz"],
    dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60))],
)


@router.get("/today", response_model=List[DailyQuizQuestion])
async def get_today_quiz(
    user: dict = Depends(get_current_user),
):
    """Fetch today's question bank (requires Supabase connection)."""
    return await DailyQuizService.get_today_questions()


@router.post("/submit", response_model=DailyQuizResult)
async def submit_quiz(
    body: DailyQuizSubmission,
    user: dict = Depends(get_current_user),
):
    """Submit quiz answers and update user streaks in Supabase."""
    return await DailyQuizService.evaluate_submission(body, user["id"])

