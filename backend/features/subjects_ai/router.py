from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from core.rate_limit import rate_limit
from .schemas import ChatRequest, ChatResponse
from .service import generate_reply, stream_reply

router = APIRouter(
    tags=["subjects-ai"],
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))],
)


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    reply = generate_reply(req.subject_id, req.messages, req.documents)
    return ChatResponse(reply=reply)


@router.post("/chat/stream")
def chat_stream(req: ChatRequest):
    return StreamingResponse(
        stream_reply(req.subject_id, req.messages, req.documents),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )