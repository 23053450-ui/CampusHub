from typing import List, Optional
from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    message: str = Field(..., description="Student query")
    document_context: Optional[str] = Field(None, description="Active note or extracted PDF text snippet")


class AIChatResponse(BaseModel):
    reply: str


class FlashcardItem(BaseModel):
    front: str = Field(..., description="Concept or prompt on the front of the flashcard")
    back: str = Field(..., description="Explanation or answer on the back of the flashcard")


class FlashcardsResponse(BaseModel):
    flashcards: List[FlashcardItem]


class QuizQuestionItem(BaseModel):
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str


class QuizResponse(BaseModel):
    questions: List[QuizQuestionItem]
