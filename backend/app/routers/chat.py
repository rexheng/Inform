from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx

from app.config import settings

router = APIRouter()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are the Inform assistant, a helpful guide for understanding NHS cancer waiting times in London.

Key knowledge:
- FDS (Faster Diagnosis Standard): 28-day target from referral to diagnosis/ruling out cancer
- 31-Day Standard: treatment should begin within 31 days of decision to treat
- 62-Day Standard: treatment should begin within 62 days of urgent GP referral
- Performance = % of patients seen within the standard timeframe
- Higher performance % = shorter waits = better
- Average wait days shown = estimated from performance percentage
- Data covers 23 London NHS trusts, published monthly by NHS England

Keep responses concise (2-3 sentences unless asked for detail). If the user has search results, reference specific providers and numbers. Be helpful, not alarmist — this is indicative data, not medical advice."""


class Message(BaseModel):
    role: str
    content: str


class SearchContext(BaseModel):
    cancer_type: str | None = None
    postcode: str | None = None
    results: list[dict] | None = None


class ChatRequest(BaseModel):
    messages: list[Message]
    context: SearchContext | None = None


def build_messages(request: ChatRequest) -> list[dict]:
    system = SYSTEM_PROMPT
    if request.context:
        ctx_parts = []
        if request.context.cancer_type:
            ctx_parts.append(f"Cancer type searched: {request.context.cancer_type}")
        if request.context.postcode:
            ctx_parts.append(f"Postcode: {request.context.postcode}")
        if request.context.results:
            top = request.context.results[:10]
            lines = []
            for r in top:
                name = r.get("name", "Unknown")
                perf = r.get("performance_fds")
                dist = r.get("distance_km")
                perf_str = f"{perf:.1f}%" if perf is not None else "N/A"
                dist_str = f"{dist:.1f}km" if dist is not None else "N/A"
                lines.append(f"- {name}: FDS performance {perf_str}, distance {dist_str}")
            ctx_parts.append("Search results:\n" + "\n".join(lines))
        if ctx_parts:
            system += "\n\nCurrent user context:\n" + "\n".join(ctx_parts)

    msgs = [{"role": "system", "content": system}]
    for m in request.messages:
        msgs.append({"role": m.role, "content": m.content})
    return msgs


@router.post("/chat")
async def chat(request: ChatRequest):
    if not settings.groq_api_key:
        return {"error": "Chat not configured — missing API key"}, 500

    messages = build_messages(request)

    async def stream():
        async with httpx.AsyncClient(timeout=15.0) as client:
            async with client.stream(
                "POST",
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "stream": True,
                    "max_tokens": 512,
                },
            ) as resp:
                if resp.status_code == 429:
                    yield "data: {\"error\": \"Too many requests, try again shortly\"}\n\n"
                    return
                if resp.status_code != 200:
                    yield f"data: {{\"error\": \"Groq API error: {resp.status_code}\"}}\n\n"
                    return
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        yield line + "\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
