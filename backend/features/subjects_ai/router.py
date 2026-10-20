from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from .schemas import ChatRequest, ChatResponse
from .service import generate_reply, stream_reply

router = APIRouter(tags=["subjects-ai"])


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    reply = generate_reply(req.subject_id, req.messages)
    return ChatResponse(reply=reply)


@router.post("/chat/stream")
def chat_stream(req: ChatRequest):
    return StreamingResponse(
        stream_reply(req.subject_id, req.messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # stops proxies like nginx from buffering the stream
        },
    )