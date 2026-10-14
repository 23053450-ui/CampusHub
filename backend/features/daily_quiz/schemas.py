from typing import List, Optional
from pydantic import BaseModel, Field


class DailyQuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    subjectCode: Optional[str] = None


class DailyQuizSubmission(BaseModel):
    answers: dict[str, int] = Field(..., description="Map of question_id -> selected_option_index")


class DailyQuizResult(BaseModel):
    score: int
    total: int
    streak: int
    feedback: Optional[str] = None
