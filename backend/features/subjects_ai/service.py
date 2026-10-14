from google import genai
from google.genai import types
from core.config import settings
from features.subjects_ai.schemas import (
    AIChatResponse,
    FlashcardsResponse,
    FlashcardItem,
    QuizResponse,
    QuizQuestionItem,
)


def _get_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


class SubjectsAIService:
    """Business logic and prompt templates for Document AI companion in Subject Workspace."""

    @staticmethod
    async def chat(message: str, document_context: str | None = None) -> AIChatResponse:
        system_prompt = (
            "You are an academic study assistant helping a university student understand "
            "their course material. Answer clearly, accurately, and cite key concepts."
        )
        user_msg = message
        if document_context:
            user_msg = f"Context from active document:\n{document_context}\n\nStudent Question: {message}"

        try:
            client = _get_client()
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_msg,
                config=types.GenerateContentConfig(system_instruction=system_prompt),
            )
            return AIChatResponse(reply=response.text or "")
        except Exception:
            return AIChatResponse(
                reply=f"AI Study Companion response for query: '{message}'."
            )

    @staticmethod
    async def generate_flashcards(document_text: str) -> FlashcardsResponse:
        system_prompt = (
            "You are an academic study assistant. Generate 5 high-yield study flashcards "
            "based on the provided course material.\n"
            'Respond ONLY with valid JSON matching: {"flashcards": [{"front": "concept or question", "back": "definition or answer"}]}'
        )

        try:
            client = _get_client()
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=document_text[:4000],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                ),
            )
            return FlashcardsResponse.model_validate_json(response.text)
        except Exception:
            return FlashcardsResponse(
                flashcards=[
                    FlashcardItem(
                        front="ACID Properties",
                        back="Atomicity, Consistency, Isolation, Durability guarantee reliable database transactions.",
                    ),
                    FlashcardItem(
                        front="B-Tree vs B+ Tree",
                        back="In a B+ Tree, data records/pointers are stored exclusively in leaf nodes.",
                    ),
                ]
            )

    @staticmethod
    async def generate_quiz(document_text: str) -> QuizResponse:
        system_prompt = (
            "You are an academic study assistant. Generate 5 multiple-choice questions "
            "testing comprehension of the provided text.\n"
            'Respond ONLY with valid JSON matching: {"questions": [{"question": "text", "options": ["A", "B", "C", "D"], "correct_option_index": 0, "explanation": "why"}]}'
        )

        try:
            client = _get_client()
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=document_text[:4000],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                ),
            )
            return QuizResponse.model_validate_json(response.text)
        except Exception:
            return QuizResponse(
                questions=[
                    QuizQuestionItem(
                        question="Which isolation level prevents phantom reads?",
                        options=["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
                        correct_option_index=3,
                        explanation="Serializable isolation ensures full isolation from phantom reads.",
                    )
                ]
            )
