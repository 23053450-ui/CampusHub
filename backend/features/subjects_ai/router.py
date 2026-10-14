from fastapi import APIRouter, Depends, Form
from core.security import get_current_user
from core.rate_limit import rate_limit
from features.subjects_ai.schemas import (
    AIChatRequest,
    AIChatResponse,
    FlashcardsResponse,
    QuizResponse,
)
from features.subjects_ai.service import SubjectsAIService

router = APIRouter(
    prefix="/subjects-ai",
    tags=["subjects-ai"],
    dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60))],
)


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_document(
    body: AIChatRequest,
    user: dict = Depends(get_current_user),
):
    """Contextual Q&A against course note / document."""
    return await SubjectsAIService.chat(
        message=body.message,
        document_context=body.document_context,
    )


@router.post("/flashcards", response_model=FlashcardsResponse)
async def generate_flashcards(
    document_text: str = Form(...),
    user: dict = Depends(get_current_user),
):
    """Generate high-yield study flashcards from document content."""
    return await SubjectsAIService.generate_flashcards(document_text=document_text)


@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    document_text: str = Form(...),
    user: dict = Depends(get_current_user),
):
    """Generate multiple-choice quiz questions from document content."""
    return await SubjectsAIService.generate_quiz(document_text=document_text)
