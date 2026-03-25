import { NextRequest } from 'next/server';

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
  const apiKey = process.env.ANTHROPIC_API_KEY;
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

    let system = SYSTEM_PROMPT;
    if (context) {
      const parts: string[] = [];
      if (context.cancer_type) parts.push(`Cancer type searched: ${context.cancer_type}`);
      if (context.postcode) parts.push(`Patient postcode: ${context.postcode}`);
      if (context.results?.length) {
        const summary = context.results.slice(0, 5).map((r: Record<string, unknown>, i: number) => {
          const waitWeeks = r.wait_weeks ?? (r.wait_days ? `${Math.round(Number(r.wait_days) / 7)}` : null);
          const waitDays = r.wait_days ?? (waitWeeks ? Number(waitWeeks) * 7 : null);
          const borough = r.borough || '';
          const meets28 = r.meets_28day ? 'yes' : 'no';
          const meets62 = r.meets_62day ? 'yes' : 'no';
          return `${i + 1}. ${r.name}${borough ? ` (${borough})` : ''} — wait: ${waitDays} days (${waitWeeks} weeks), meets 28-day target: ${meets28}, meets 62-day target: ${meets62}`;
        });
        parts.push(`Top hospitals (shortest wait first):\n${summary.join('\n')}`);
      }
      if (parts.length) {
        system += `\n\n--- SEARCH RESULTS (use these to answer) ---\n${parts.join('\n')}`;
      }
    }

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', response.status, err);
      return Response.json(
        { error: 'Chat service unavailable' },
        { status: 502 },
      );
    }

    // Transform Anthropic SSE stream into OpenAI-compatible format for the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  // Emit in OpenAI-compatible format that useChat expects
                  const chunk = JSON.stringify({
                    choices: [{ delta: { content: parsed.delta.text } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                }
              } catch {
                // skip malformed lines
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          console.error('Stream error:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
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
