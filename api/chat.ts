import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are the Inform assistant, a helpful guide for understanding NHS cancer waiting times in London.

Key knowledge:
- FDS (Faster Diagnosis Standard): 28-day target from referral to diagnosis/ruling out cancer
- 31-Day Standard: treatment should begin within 31 days of decision to treat
- 62-Day Standard: treatment should begin within 62 days of urgent GP referral
- Performance = % of patients seen within the standard timeframe
- Higher performance % = shorter waits = better
- Average wait days shown = estimated from performance percentage
- Data covers 23 London NHS trusts, published monthly by NHS England

Keep responses concise (2-3 sentences unless asked for detail). If the user has search results, reference specific providers and numbers. Be helpful, not alarmist — this is indicative data, not medical advice.`;

interface Message {
  role: string;
  content: string;
}

interface SearchContext {
  cancer_type?: string;
  postcode?: string;
  results?: Record<string, unknown>[];
}

interface ChatRequestBody {
  messages: Message[];
  context?: SearchContext;
}

function buildMessages(body: ChatRequestBody): Message[] {
  let system = SYSTEM_PROMPT;

  if (body.context) {
    const parts: string[] = [];
    if (body.context.cancer_type) {
      parts.push(`Cancer type searched: ${body.context.cancer_type}`);
    }
    if (body.context.postcode) {
      parts.push(`Postcode: ${body.context.postcode}`);
    }
    if (body.context.results) {
      const top = body.context.results.slice(0, 10);
      const lines = top.map((r) => {
        const name = (r.name as string) || 'Unknown';
        const perf = r.performance_fds as number | null;
        const dist = r.distance_km as number | null;
        const perfStr = perf != null ? `${perf.toFixed(1)}%` : 'N/A';
        const distStr = dist != null ? `${dist.toFixed(1)}km` : 'N/A';
        return `- ${name}: FDS performance ${perfStr}, distance ${distStr}`;
      });
      parts.push('Search results:\n' + lines.join('\n'));
    }
    if (parts.length > 0) {
      system += '\n\nCurrent user context:\n' + parts.join('\n');
    }
  }

  return [
    { role: 'system', content: system },
    ...body.messages,
  ];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Chat not configured — missing API key' });
    return;
  }

  const body = req.body as ChatRequestBody;
  if (!body.messages || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  const messages = buildMessages(body);

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        stream: true,
        max_tokens: 512,
      }),
    });

    if (groqRes.status === 429) {
      res.status(429).json({ error: 'Too many requests, try again shortly' });
      return;
    }

    if (!groqRes.ok) {
      res.status(502).json({ error: `Groq API error: ${groqRes.status}` });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = groqRes.body?.getReader();
    if (!reader) {
      res.status(502).json({ error: 'No response body from Groq' });
      return;
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to connect to AI service' });
    } else {
      res.end();
    }
  }
}
