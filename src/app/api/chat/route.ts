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
Use the hospital data to give a specific, confident recommendation. The hospitals are already sorted — #1 has the shortest wait. Include:
- The top hospital name, its borough, and wait time in weeks/days
- One or two other good options with their wait times
- A short note that under the NHS Constitution they can ask their GP to re-refer them to any NHS hospital they choose

DATA FIELD REFERENCE (do not expose these labels to the user):
- name = hospital/trust name
- borough = London borough where it's located
- wait_weeks = average wait in weeks for the selected cancer type
- wait_days = same wait converted to days
- meets_28day = whether trust meets the 28-day faster diagnosis standard
- meets_62day = whether trust meets the 62-day treatment standard

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
          const waitWeeks = r.wait_weeks ?? r.wait_days ? `${Math.round(Number(r.wait_days) / 7)}` : null;
          const waitDays = r.wait_days ?? (waitWeeks ? Number(waitWeeks) * 7 : null);
          const borough = r.borough || '';
          const meets28 = r.meets_28day ? 'yes' : 'no';
          const meets62 = r.meets_62day ? 'yes' : 'no';
          // Support both old search-result format and new trust format
          if (r.performance_62d != null) {
            const perf62 = `${(Number(r.performance_62d) * 100).toFixed(0)}%`;
            return `${i + 1}. ${r.name} — ${Number(r.distance_km).toFixed(1)}km away, 62-day performance: ${perf62}`;
          }
          return `${i + 1}. ${r.name}${borough ? ` (${borough})` : ''} — wait: ${waitDays} days (${waitWeeks} weeks), meets 28-day target: ${meets28}, meets 62-day target: ${meets62}`;
        });
        parts.push(`Top hospitals (shortest wait first):\n${summary.join('\n')}`);
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
