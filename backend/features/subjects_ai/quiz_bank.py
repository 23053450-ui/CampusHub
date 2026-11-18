"""Admin & Moderator Quiz Bank question generation and curation.

Allows staff to generate high-quality MCQs from community-approved notes/PYQs
using the Gemini API and save them into public.daily_quiz_questions.
"""

from __future__ import annotations

import io
import json
import logging
import uuid
from typing import Any, Literal

from fastapi import HTTPException
from google.genai import types
from pydantic import BaseModel, Field
from supabase import Client, create_client

from core.config import settings
from .errors import parse_gemini_error
from .service import get_client

logger = logging.getLogger(__name__)


class QuizBankGenerateRequest(BaseModel):
    subject_id: str = Field(min_length=1, max_length=50)
    note_ids: list[str] = Field(min_length=1, max_length=5)
    topic: str | None = Field(default=None, max_length=150)
    count: int = Field(default=5, ge=1, le=20)
    difficulty: Literal["easy", "medium", "hard"] | None = None


class QuizBankQuestionItem(BaseModel):
    question: str = Field(min_length=1)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: str = Field(min_length=1)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    topic: str = Field(default="Fundamentals", min_length=1)


class QuizBankGenerateResponse(BaseModel):
    title: str
    questions: list[QuizBankQuestionItem]


class ApproveQuizQuestionItem(BaseModel):
    question: str = Field(min_length=1)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: str = Field(min_length=1)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    topic: str = Field(default="Fundamentals", min_length=1)
    source_snippet: str | None = None


class ApproveQuizQuestionsRequest(BaseModel):
    subject_id: str = Field(min_length=1, max_length=50)
    questions: list[ApproveQuizQuestionItem] = Field(min_length=1)


class ApproveQuizQuestionsResponse(BaseModel):
    inserted: int


def _get_supabase_client(user: dict[str, Any]) -> Client | None:
    if settings.supabase_service_role_key:
        return create_client(settings.supabase_url, settings.supabase_service_role_key)
    access_token = user.get("_access_token")
    if access_token and settings.supabase_url and settings.supabase_anon_key:
        client = create_client(settings.supabase_url, settings.supabase_anon_key)
        client.postgrest.auth(str(access_token))
        return client
    return None


def verify_staff(user: dict[str, Any], subject_id: str, client: Client | None) -> None:
    role = user.get("role", "")
    if role == "admin":
        return

    if client is None:
        # Mock mode fallback: allow if role is staff/admin/moderator
        if role in ("admin", "moderator", "staff"):
            return
        return

    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=403, detail="Staff access required.")

    # 1. Check profile role
    try:
        profile_res = (
            client.table("profiles")
            .select("role")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        if profile_res.data and profile_res.data.get("role") == "admin":
            return
    except Exception as exc:
        logger.warning("Failed to verify admin profile: %s", exc)

    # 2. Check community_moderators table
    try:
        mod_res = (
            client.table("community_moderators")
            .select("subject_id")
            .eq("user_id", user_id)
            .eq("subject_id", subject_id)
            .maybe_single()
            .execute()
        )
        if mod_res.data:
            return
    except Exception as exc:
        logger.warning("Failed to verify moderator status: %s", exc)

    raise HTTPException(
        status_code=403,
        detail="You do not have moderator or admin authority for this subject.",
    )


def generate_quiz_bank_questions(
    user: dict[str, Any],
    req: QuizBankGenerateRequest,
) -> QuizBankGenerateResponse:
    client = _get_supabase_client(user)
    verify_staff(user, req.subject_id, client)

    # Handle mock mode when no live database client exists
    if client is None:
        sample_questions: list[QuizBankQuestionItem] = [
            QuizBankQuestionItem(
                question=f"In {req.subject_id.upper()}, what is the primary purpose of {req.topic or 'core principles'}?",
                options=[
                    "To guarantee fault tolerance and deterministic state",
                    "To minimize runtime overhead without safety checks",
                    "To bypass standard synchronization primitives",
                    "To delegate execution to unmanaged hardware buffers",
                ],
                correct_index=0,
                explanation="Core principles in this topic enforce guaranteed state consistency and fault recovery.",
                difficulty=req.difficulty or "medium",
                topic=req.topic or "Core Principles",
            ),
            QuizBankQuestionItem(
                question=f"Which metric is most critical when evaluating efficiency in {req.subject_id.upper()}?",
                options=[
                    "Amortized worst-case time complexity",
                    "Number of raw source code lines",
                    "Local variable naming convention",
                    "Compiler version major number",
                ],
                correct_index=0,
                explanation="Asymptotic amortized analysis provides the true theoretical bound for performance under scale.",
                difficulty=req.difficulty or "easy",
                topic=req.topic or "Performance Analysis",
            ),
        ]
        return QuizBankGenerateResponse(
            title=f"{req.subject_id.upper()} Generated Quiz Bank",
            questions=sample_questions[: req.count],
        )

    # 1. Fetch note records from database
    try:
        notes_res = (
            client.table("notes")
            .select("id, title, storage_path, tag")
            .in_("id", req.note_ids)
            .execute()
        )
        notes = notes_res.data or []
    except Exception as exc:
        logger.exception("Failed to query notes for quiz generation")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve selected study notes.",
        ) from exc

    if not notes:
        raise HTTPException(
            status_code=404,
            detail="None of the selected study notes were found.",
        )

    uploaded_gemini_files: list[Any] = []
    parts: list[types.Part] = []

    try:
        for note in notes:
            storage_path = note.get("storage_path")
            title = note.get("title", "Note")

            parts.append(types.Part(text=f"Reference Document: {title} (Tag: {note.get('tag', 'General')})"))

            if not storage_path:
                continue

            # Download note PDF from Supabase storage
            try:
                pdf_bytes = client.storage.from_("subject-notes").download(storage_path)
            except Exception as exc:
                logger.warning("Could not download note %s from storage: %s", storage_path, exc)
                continue

            if pdf_bytes and b"%PDF-" in pdf_bytes[:1024]:
                stream = io.BytesIO(pdf_bytes)
                stream.name = f"{title}.pdf"
                uploaded = get_client().files.upload(
                    file=stream,
                    config={"mime_type": "application/pdf"},
                )
                uploaded_gemini_files.append(uploaded)
                parts.append(
                    types.Part.from_uri(
                        file_uri=uploaded.uri,
                        mime_type="application/pdf",
                    )
                )

        if not parts:
            raise HTTPException(
                status_code=400,
                detail="No readable PDF content could be extracted from the selected notes.",
            )

        topic = (req.topic or "").strip()
        difficulty_hint = (
            f"Set the difficulty level around: {req.difficulty}."
            if req.difficulty
            else "Provide a balanced mix of difficulty levels."
        )

        prompt = f"""
You are an expert university professor creating rigorous multiple-choice questions (MCQs) for the subject '{req.subject_id}'.
Generate exactly {req.count} high-quality MCQs based on the supplied reference materials.

Topic Focus: {topic if topic else 'Key topics from the materials'}
Difficulty Guideline: {difficulty_hint}

Strict Requirements:
1. Each question must test conceptual understanding or practical problem-solving (not superficial trivia).
2. Exactly 4 distinct, plausible options per question.
3. Only 1 strictly correct option.
4. correct_index must be 0, 1, 2, or 3.
5. Provide a clear, educational explanation of why the correct option is right and others are wrong.
6. Specify the difficulty ("easy", "medium", or "hard") and a concise topic name.
7. Return ONLY valid JSON in this exact structure:

{{
  "title": "{req.subject_id.upper()} Question Deck",
  "questions": [
    {{
      "question": "Clear question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Detailed explanation.",
      "difficulty": "medium",
      "topic": "Topic Name"
    }}
  ]
}}
"""
        parts.append(types.Part(text=prompt))

        response = get_client().models.generate_content(
            model=settings.gemini_model,
            contents=[
                types.Content(
                    role="user",
                    parts=parts,
                )
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
                system_instruction=(
                    "You are a computer science faculty examiner. "
                    "Generate rigorous, accurate, university-level multiple choice questions."
                ),
            ),
        )

        if not response.text:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty response.",
            )

        data = json.loads(response.text)
        raw_questions = data.get("questions") or []

        parsed_questions: list[QuizBankQuestionItem] = []
        for item in raw_questions:
            if not isinstance(item, dict):
                continue
            q_text = str(item.get("question", "")).strip()
            opts = item.get("options")
            c_idx = item.get("correct_index")
            exp = str(item.get("explanation", "")).strip()
            diff = item.get("difficulty")
            if diff not in ("easy", "medium", "hard"):
                diff = req.difficulty or "medium"
            top = str(item.get("topic", topic or "Fundamentals")).strip()

            if (
                q_text
                and isinstance(opts, list)
                and len(opts) == 4
                and all(isinstance(o, str) and o.strip() for o in opts)
                and isinstance(c_idx, int)
                and 0 <= c_idx <= 3
                and exp
            ):
                parsed_questions.append(
                    QuizBankQuestionItem(
                        question=q_text,
                        options=[o.strip() for o in opts],
                        correct_index=c_idx,
                        explanation=exp,
                        difficulty=diff,
                        topic=top or "Fundamentals",
                    )
                )

        if not parsed_questions:
            raise HTTPException(
                status_code=502,
                detail="Could not parse valid questions from the AI output.",
            )

        return QuizBankGenerateResponse(
            title=str(data.get("title", f"{req.subject_id.upper()} Quiz Deck")),
            questions=parsed_questions,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Quiz bank generation failed")
        status_code, user_msg = parse_gemini_error(exc)
        raise HTTPException(status_code=status_code, detail=user_msg)
    finally:
        # Clean up temporary Gemini uploaded files
        for f in uploaded_gemini_files:
            try:
                get_client().files.delete(name=f.name)
            except Exception:
                pass


def approve_quiz_bank_questions(
    user: dict[str, Any],
    req: ApproveQuizQuestionsRequest,
) -> ApproveQuizQuestionsResponse:
    client = _get_supabase_client(user)
    verify_staff(user, req.subject_id, client)

    if client is None:
        return ApproveQuizQuestionsResponse(inserted=len(req.questions))

    rows_to_insert = []
    for q in req.questions:
        q_id = f"{req.subject_id}-{uuid.uuid4().hex[:8]}"
        rows_to_insert.append(
            {
                "id": q_id,
                "subject_id": req.subject_id,
                "question": q.question,
                "options": q.options,
                "correct_answer_index": q.correct_index,
                "explanation": q.explanation,
                "source": "ai",
                "status": "approved",
                "difficulty": q.difficulty,
                "topic": q.topic,
                "source_snippet": q.source_snippet or "Generated via AI Quiz Bank from community notes",
            }
        )

    try:
        res = client.table("daily_quiz_questions").insert(rows_to_insert).execute()
        count = len(res.data) if res.data else len(rows_to_insert)
        return ApproveQuizQuestionsResponse(inserted=count)
    except Exception as exc:
        logger.exception("Failed to insert approved quiz questions")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save questions into question bank: {exc}",
        )
