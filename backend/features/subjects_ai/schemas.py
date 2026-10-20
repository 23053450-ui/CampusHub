"""
Pydantic schemas for subjects_ai feature.
Owner: subjects_ai team
"""
from typing import Literal
from pydantic import BaseModel


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    subject_id: str
    messages: list[Message]


class ChatResponse(BaseModel):
    reply: str