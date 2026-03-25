import { NextRequest } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are ClearPath Assistant, an NHS cancer waiting times advisor.

When the user mentions their current wait time or asks for alternatives, you MUST give a specific recommendation using the search results data provided. Format your response like this:

1. **Acknowledge** their current situation briefly
2. **Recommend** the best-performing hospital from the search results, including:
   - Hospital name
   - Distance from them (use distance_km from results)
   - Performance percentage (use performance_62d for 62-day standard)
   - How this compares to their current wait (e.g. "85% of patients seen within 62 days vs the average of 70%")
3. **Mention** 1-2 other good options if available
4. **Explain** they have the legal right to choose their hospital (NHS Constitution Section 2a) and should ask their GP for a re-referral

Key data fields in search results:
- name: hospital name
- distance_km: distance from patient's postcode
- performance_62d: % of patients treated within 62 days of urgent referral (higher = better)
- performance_31d: % treated within 31 days of decision to treat
- performance_fds: % receiving faster diagnosis (within 28 days)
- total_patients_62d: volume of patients (higher = more experienced)
- score: overall ClearPath ranking score

Keep responses concise, warm, and actionable. Use plain language.

Important:
- Never provide medical diagnoses or treatment advice
- Always recommend speaking with their GP for clinical decisions
- Be honest that data is based on published NHS statistics and is indicative
- If no search results are available, explain how to use the search to find hospitals`;

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
