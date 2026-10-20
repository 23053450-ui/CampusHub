import json
import logging
from collections.abc import Iterator
from functools import lru_cache

from fastapi import HTTPException
from google import genai
from google.genai import types

from core.config import settings
from .schemas import Message

logger = logging.getLogger(__name__)


@lru_cache
def get_client() -> genai.Client:
    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")
    return genai.Client(api_key=settings.gemini_api_key)


def _build_request(subject_id: str, messages: list[Message]):
    """Validate input and build the Gemini request. Raises before any streaming starts."""
    if messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="Last message must be from the user")

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
    config = types.GenerateContentConfig(system_instruction=system_prompt)
    return contents, config


def generate_reply(subject_id: str, messages: list[Message]) -> str:
    contents, config = _build_request(subject_id, messages)
    try:
        response = get_client().models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            config=config,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Gemini call failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    return response.text or "Sorry, I couldn't generate a response."


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def stream_reply(subject_id: str, messages: list[Message]) -> Iterator[str]:
    # These run immediately, so failures still produce a proper 400/500 status.
    contents, config = _build_request(subject_id, messages)
    client = get_client()

    def event_stream() -> Iterator[str]:
        try:
            for chunk in client.models.generate_content_stream(
                model=settings.gemini_model,
                contents=contents,
                config=config,
            ):
                if chunk.text:
                    yield _sse({"type": "token", "text": chunk.text})
            yield _sse({"type": "done"})
        except Exception:
            logger.exception("Gemini streaming failed")
            yield _sse({"type": "error", "message": "The AI service had a problem. Please try again."})

    return event_stream()