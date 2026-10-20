"""
APIRouter endpoints for subjects_ai feature.
Owner: subjects_ai team
"""
from fastapi import APIRouter

from .schemas import ChatRequest, ChatResponse
from .service import generate_reply

router = APIRouter(prefix="/subjects-ai", tags=["subjects-ai"])


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    reply = generate_reply(req.subject_id, req.messages)
    return ChatResponse(reply=reply)