from functools import lru_cache

from fastapi import HTTPException
from google import genai
from google.genai import types

from core.config import settings
from .schemas import Message


@lru_cache
def get_client() -> genai.Client:
    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")
    return genai.Client(api_key=settings.gemini_api_key)


def generate_reply(subject_id: str, messages: list[Message]) -> str:
    # Gemini calls the assistant role "model"
    contents = [
        types.Content(
            role="user" if m.role == "user" else "model",
            parts=[types.Part(text=m.content)],
        )
        for m in messages
    ]

    system_prompt = (
        f"You are a study assistant for the university subject '{subject_id}'. "
        "Explain concepts clearly and concisely for undergraduate students. "
        "If you are unsure, say so instead of guessing."
    )

    try:
        response = get_client().models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=system_prompt),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    return response.text or "Sorry, I couldn't generate a response."