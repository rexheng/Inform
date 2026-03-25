import { NextRequest } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are ClearPath Assistant — a friendly, concise NHS cancer wait-time advisor. You talk like a knowledgeable friend, not a report.

STYLE RULES (strict):
- Write in natural, flowing paragraphs. NO section headings, labels, or numbered steps.
- Never say words like "Acknowledge", "Recommend", "Mention", "Explain" as headings.
- Bold hospital names with **name**. Nothing else bolded.
- Keep the whole reply under 80 words. Shorter is better.
- Use "you" and "your", not "the patient".

WHEN THE USER ASKS ABOUT WAIT TIMES OR ALTERNATIVES:
Use the search results to give a specific, confident recommendation. The results are already ranked — #1 is the best option. Include:
- The top hospital name, how far it is, and its 62-day performance as a percentage (e.g. "85% of patients are treated within 62 days")
- One or two other nearby options with distance and performance
- A short note that under the NHS Constitution they can ask their GP to re-refer them to any NHS hospital they choose

DATA FIELD REFERENCE (do not expose these labels to the user):
- name = hospital name
- distance_km = distance from their postcode in km
- performance_62d = fraction of patients treated within 62 days (multiply by 100 for %)
- performance_31d = fraction treated within 31 days of decision to treat
- total_patients_62d = patient volume

RULES:
- Never diagnose or give treatment advice
- End with a gentle nudge to discuss with their GP
- If no search results exist, tell them to use the search bar to find hospitals first`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'Chat service not configured' },
      { status: 503 },
    );
  }

  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Messages are required' },
        { status: 400 },
      );
    }

    // Build system message with optional search context
    let system = SYSTEM_PROMPT;
    if (context) {
      const parts: string[] = [];
      if (context.cancer_type) parts.push(`Cancer type searched: ${context.cancer_type}`);
      if (context.postcode) parts.push(`Patient postcode: ${context.postcode}`);
      if (context.results?.length) {
        const summary = context.results.slice(0, 5).map((r: Record<string, unknown>, i: number) => {
          const perf62 = r.performance_62d != null ? `${(Number(r.performance_62d) * 100).toFixed(0)}%` : 'N/A';
          const perf31 = r.performance_31d != null ? `${(Number(r.performance_31d) * 100).toFixed(0)}%` : 'N/A';
          const fds = r.performance_fds != null ? `${(Number(r.performance_fds) * 100).toFixed(0)}%` : 'N/A';
          return `${i + 1}. ${r.name} — ${Number(r.distance_km).toFixed(1)}km away, 62-day: ${perf62}, 31-day: ${perf31}, FDS: ${fds}, patients: ${r.total_patients_62d}`;
        });
        parts.push(`Top hospitals (ranked by ClearPath score):\n${summary.join('\n')}`);
      }
      if (parts.length) {
        system += `\n\n--- SEARCH RESULTS (use these to answer) ---\n${parts.join('\n')}`;
      }
    }

    const groqMessages = [
      { role: 'system', content: system },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, err);
      return Response.json(
        { error: 'Chat service unavailable' },
        { status: 502 },
      );
    }

    // Stream the response through to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat route error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
