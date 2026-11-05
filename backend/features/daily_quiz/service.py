"""
Business logic for the Daily Quiz feature.
Supports Supabase database-backed pool with least-privilege RPC execution,
with seamless local in-memory fallback for offline/mock development.
"""

from datetime import date
import logging
from typing import Any
from fastapi import HTTPException
from supabase import Client, create_client

from core.config import settings
from features.daily_quiz.schemas import (
    QuestionFeedback,
    QuizSubmissionRequest,
    QuizSubmissionResponse,
)
from features.daily_quiz.streak import calculate_streak

logger = logging.getLogger(__name__)

# Fallback questions for offline/mock development
SAMPLE_QUESTIONS = [
    {
        "id": "q1",
        "question": "Which data structure follows FIFO?",
        "options": ["Stack", "Queue", "Tree", "Graph"],
        "correct_answer_index": 1,
        "explanation": "A queue follows First In, First Out (FIFO).",
    },
    {
        "id": "q2",
        "question": "Which keyword is used to inherit a class in Java?",
        "options": ["implements", "inherits", "extends", "super"],
        "correct_answer_index": 2,
        "explanation": "Java uses the extends keyword for class inheritance.",
    },
    {
        "id": "q3",
        "question": "What is the average time complexity of binary search?",
        "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        "correct_answer_index": 1,
        "explanation": "Binary search halves the search space at each step.",
    },
    {
        "id": "q4",
        "question": "Which SQL clause filters grouped results?",
        "options": ["WHERE", "ORDER BY", "HAVING", "DISTINCT"],
        "correct_answer_index": 2,
        "explanation": "HAVING filters groups after GROUP BY is applied.",
    },
    {
        "id": "q5",
        "question": "Which Python keyword defines a function?",
        "options": ["func", "function", "def", "method"],
        "correct_answer_index": 2,
        "explanation": "Python uses def to define a function.",
    },
]

# In-memory mock streaks and submissions
_mock_user_streaks: dict[str, dict[str, Any]] = {}
_mock_user_submissions: set[tuple[str, str]] = set()


def _get_supabase_client(user: dict[str, Any]) -> Client | None:
    access_token = user.get("_access_token")
    if not access_token:
        return None

    if not settings.supabase_url or "placeholder" in settings.supabase_url:
        return None

    try:
        client = create_client(settings.supabase_url, settings.supabase_anon_key)
        client.postgrest.auth(str(access_token))
        return client
    except Exception as e:
        logger.warning("Could not initialize Supabase user client: %s", e)
        return None


def get_today_questions(user: dict[str, Any]) -> dict[str, Any]:
    """
    Return today's questions without revealing correct answers
    or explanations before submission.
    """
    client = _get_supabase_client(user)
    if client:
        try:
            res = client.rpc("get_today_quiz").execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error("Supabase get_today_quiz RPC error: %s", e)
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve today's quiz from database.",
            )

    # Local fallback for offline/mock development
    user_id = user.get("id", "mock-user")
    today_str = date.today().isoformat()
    already_submitted = (user_id, today_str) in _mock_user_submissions

    return {
        "date": today_str,
        "already_submitted": already_submitted,
        "questions": [
            {
                "id": question["id"],
                "question": question["question"],
                "options": question["options"],
            }
            for question in SAMPLE_QUESTIONS
        ],
    }


def submit_quiz(
    user: dict[str, Any],
    request: QuizSubmissionRequest,
) -> QuizSubmissionResponse:
    """
    Evaluate submitted answers and return the score, streak, and feedback.
    """
    client = _get_supabase_client(user)
    if client:
        try:
            res = client.rpc(
                "submit_daily_quiz",
                {"p_answers": request.answers},
            ).execute()

            data = res.data
            details = {}
            if data.get("details"):
                for qid, item in data["details"].items():
                    details[qid] = QuestionFeedback(
                        is_correct=item["is_correct"],
                        correct_answer_index=item["correct_answer_index"],
                        explanation=item["explanation"],
                    )

            return QuizSubmissionResponse(
                score=data["score"],
                total=data["total"],
                streak_count=data["streak_count"],
                details=details,
            )
        except Exception as e:
            err_msg = str(e)
            logger.error("Supabase submit_daily_quiz RPC error: %s", err_msg)
            if "already been completed" in err_msg:
                raise HTTPException(
                    status_code=400,
                    detail="Daily quiz has already been completed for today.",
                )
            raise HTTPException(
                status_code=500,
                detail="Failed to evaluate daily quiz submission.",
            )

    # Offline/mock evaluation
    user_id = user.get("id", "mock-user")
    today = date.today()
    today_str = today.isoformat()

    if (user_id, today_str) in _mock_user_submissions:
        raise HTTPException(
            status_code=400,
            detail="Daily quiz has already been completed for today.",
        )

    question_map = {
        question["id"]: question
        for question in SAMPLE_QUESTIONS
    }

    # Validate question IDs and selected option indexes.
    for question_id, selected_index in request.answers.items():
        if question_id not in question_map:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown question ID: {question_id}",
            )

        options = question_map[question_id]["options"]
        if selected_index < 0 or selected_index >= len(options):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid answer index for question {question_id}",
            )

    score = 0
    details = {}
    for question_id, question in question_map.items():
        correct_idx = question["correct_answer_index"]
        user_idx = request.answers.get(question_id)
        is_correct = user_idx == correct_idx
        if is_correct:
            score += 1
        details[question_id] = QuestionFeedback(
            is_correct=is_correct,
            correct_answer_index=correct_idx,
            explanation=question.get("explanation", ""),
        )

    # Compute streak
    user_streak_record = _mock_user_streaks.get(
        user_id,
        {"current_streak": 0, "best_streak": 0, "last_completed_date": None},
    )

    new_streak = calculate_streak(
        current_streak=user_streak_record["current_streak"],
        last_completed_date=user_streak_record["last_completed_date"],
        today=today,
    )
    user_streak_record["current_streak"] = new_streak
    user_streak_record["best_streak"] = max(user_streak_record["best_streak"], new_streak)
    user_streak_record["last_completed_date"] = today
    _mock_user_streaks[user_id] = user_streak_record
    _mock_user_submissions.add((user_id, today_str))

    return QuizSubmissionResponse(
        score=score,
        total=len(question_map),
        streak_count=new_streak,
        details=details,
    )
