"""
Request and response schemas for the Daily Quiz feature.
"""

from typing import Dict

from pydantic import BaseModel, Field, ConfigDict


class QuizQuestion(BaseModel):
    """A single quiz question."""

    id: str
    question: str
    options: list[str]


class TodayQuizResponse(BaseModel):
    """Response containing today's quiz."""

    date: str
    questions: list[QuizQuestion]


class QuizSubmissionRequest(BaseModel):
    """Answers submitted by a student."""

    answers: Dict[str, int] = Field(
        ...,
        description="Mapping of question IDs to selected option indexes.",
    )


class QuizSubmissionResponse(BaseModel):
    """Result returned after submitting a quiz."""

    score: int
    total: int
    streak_count: int


class QuizSubmissionRecord(BaseModel):
    """Internal representation of a quiz submission."""

    model_config = ConfigDict(extra="ignore")

    user_id: str
    quiz_date: str
    score: int
    total_questions: int
    answers: Dict[str, int]