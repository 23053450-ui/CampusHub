#!/usr/bin/env python3
"""
Offline Batch Generator for Daily Quiz Questions
Generates verified MCQs from notes or syllabus topics using the Google Gemini API,
validates format integrity, and securely stages them into Supabase via service role.
"""

import argparse
import json
import os
import sys
import uuid
from typing import Any

# Ensure root backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def get_gemini_client():
    try:
        from google import genai
    except ImportError:
        print("Error: google-genai is required. Run: pip install google-genai", file=sys.stderr)
        sys.exit(1)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is missing.", file=sys.stderr)
        sys.exit(1)
    return genai.Client(api_key=api_key)


def get_supabase_admin_client():
    try:
        from supabase import create_client
    except ImportError:
        print("Error: supabase-py is required. Run: pip install supabase", file=sys.stderr)
        sys.exit(1)

    supabase_url = os.getenv("SUPABASE_URL")
    # Service role key bypasses RLS and can write pending questions to the database
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not service_key:
        print(
            "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env to stage questions.",
            file=sys.stderr,
        )
        sys.exit(1)

    return create_client(supabase_url, service_key)


def build_prompt(
    subject_id: str,
    topic: str | None,
    source_type: str,
    count: int,
    text_content: str | None,
) -> str:
    content_clause = (
        f"\nSOURCE MATERIAL TO GROUND QUESTIONS ON:\n\"\"\"\n{text_content}\n\"\"\"\n"
        if text_content
        else "\nUse standard university syllabus curriculum for this subject.\n"
    )

    pyq_guidance = (
        "- Format and difficulty should mirror actual past semester university exam papers (PYQs).\n"
        "- Focus on high-frequency, conceptually rigorous exam questions.\n"
        if source_type == "pyq"
        else "- Focus on conceptual understanding and curriculum clarity.\n"
    )

    return f"""You are a university exam assessment specialist creating high-quality multiple choice questions (MCQs) for the subject '{subject_id}'.
{f"Target Topic: {topic}" if topic else ""}
Number of questions needed: {count}

{content_clause}
Guidelines:
- Each question must test a single clear concept.
- Exactly 4 options per question.
- All 4 options must be distinct, plausible, and grammatically parallel.
- Exactly one option is correct. Zero-based correct_answer_index must be 0, 1, 2, or 3.
- Provide a concise 1-2 sentence explanation of why the correct answer is right and others are wrong.
- Provide a brief 'source_snippet' citation from the notes or core definition so reviewers can quickly verify accuracy.
- difficulty must be one of: 'easy', 'medium', 'hard'.
{pyq_guidance}
- Return ONLY valid JSON adhering strictly to this schema:

{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
      "correct_answer_index": 0,
      "explanation": "Clear explanation of the answer.",
      "difficulty": "medium",
      "topic": "{topic or subject_id}",
      "source_snippet": "Relevant textbook/notes snippet supporting the answer."
    }}
  ]
}}
"""


def validate_question(q: dict[str, Any]) -> bool:
    question = q.get("question")
    options = q.get("options")
    correct_idx = q.get("correct_answer_index")
    explanation = q.get("explanation")
    difficulty = q.get("difficulty")

    if not isinstance(question, str) or len(question.strip()) < 5:
        return False

    if not isinstance(options, list) or len(options) != 4:
        return False

    # Check that all options are non-empty strings and unique
    clean_options = [str(opt).strip() for opt in options]
    if any(len(opt) == 0 for opt in clean_options):
        return False
    if len(set(clean_options)) != 4:
        return False

    if not isinstance(correct_idx, int) or correct_idx not in (0, 1, 2, 3):
        return False

    if not isinstance(explanation, str) or len(explanation.strip()) < 5:
        return False

    if difficulty not in ("easy", "medium", "hard"):
        q["difficulty"] = "medium"

    return True


def generate_questions(
    gemini_client: Any,
    model_name: str,
    subject_id: str,
    topic: str | None,
    source_type: str,
    count: int,
    text_content: str | None,
) -> list[dict[str, Any]]:
    from google.genai import types
    prompt = build_prompt(subject_id, topic, source_type, count, text_content)

    print(f"Calling Gemini ({model_name}) to generate {count} questions for subject '{subject_id}'...")

    response = gemini_client.models.generate_content(
        model=model_name,
        contents=[
            types.Content(
                role="user",
                parts=[types.Part(text=prompt)],
            )
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.3,
            system_instruction=(
                "You are an academic assessment expert. Generate rigorously accurate university-level "
                "multiple-choice questions. Never invent facts."
            ),
        ),
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response.")

    parsed = json.loads(response.text)
    raw_questions = parsed.get("questions")
    if not isinstance(raw_questions, list):
        raise ValueError("JSON response missing 'questions' list.")

    valid_questions = []
    for item in raw_questions:
        if validate_question(item):
            valid_questions.append(item)
        else:
            print(f"Skipping malformed question candidate: {item.get('question', 'UNKNOWN')}")

    return valid_questions


def stage_questions_to_db(
    supabase_client: Any,
    subject_id: str,
    source: str,
    status: str,
    questions: list[dict[str, Any]],
) -> int:
    records = []
    for q in questions:
        qid = f"{subject_id}-{uuid.uuid4().hex[:8]}"
        records.append(
            {
                "id": qid,
                "subject_id": subject_id,
                "question": q["question"].strip(),
                "options": q["options"],
                "correct_answer_index": q["correct_answer_index"],
                "explanation": q["explanation"].strip(),
                "source": source,
                "status": status,
                "difficulty": q.get("difficulty", "medium"),
                "topic": q.get("topic") or subject_id,
                "source_snippet": q.get("source_snippet", ""),
            }
        )

    res = supabase_client.table("daily_quiz_questions").insert(records).execute()
    return len(res.data) if res.data else len(records)


def main():
    parser = argparse.ArgumentParser(
        description="Offline batch generator for Daily Quiz questions using Gemini"
    )
    parser.add_argument(
        "--subject",
        required=True,
        help="Subject ID (e.g. dbms, cn, os, dsa)",
    )
    parser.add_argument(
        "--topic",
        default=None,
        help="Specific topic name (e.g. 'Normal Forms', 'Routing Protocols')",
    )
    parser.add_argument(
        "--source",
        choices=["ai", "pyq", "manual"],
        default="ai",
        help="Source attribution tag (default: ai)",
    )
    parser.add_argument(
        "--status",
        choices=["pending", "approved", "rejected"],
        default="pending",
        help="Target status in database (default: pending)",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=5,
        help="Number of questions to generate (default: 5)",
    )
    parser.add_argument(
        "--file",
        default=None,
        help="Path to local notes / syllabus text file to ground questions on",
    )
    parser.add_argument(
        "--model",
        default=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
        help="Gemini model identifier",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate and validate without inserting into Supabase",
    )

    args = parser.parse_args()

    file_content = None
    if args.file:
        if not os.path.exists(args.file):
            print(f"Error: File '{args.file}' not found.", file=sys.stderr)
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8", errors="ignore") as f:
            file_content = f.read()[:15000]  # Cap input text chunk to avoid overflowing prompt

    gemini_client = get_gemini_client()
    questions = generate_questions(
        gemini_client=gemini_client,
        model_name=args.model,
        subject_id=args.subject,
        topic=args.topic,
        source_type=args.source,
        count=args.count,
        text_content=file_content,
    )

    print(f"\nGenerated {len(questions)} valid questions.")

    if args.dry_run:
        print("\n--- DRY RUN: Generated Questions ---")
        print(json.dumps(questions, indent=2))
        return

    supabase_client = get_supabase_admin_client()
    inserted_count = stage_questions_to_db(
        supabase_client=supabase_client,
        subject_id=args.subject,
        source=args.source,
        status=args.status,
        questions=questions,
    )

    print(
        f"Successfully staged {inserted_count} questions for subject '{args.subject}' with status='{args.status}'."
    )


if __name__ == "__main__":
    main()
