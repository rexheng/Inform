import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `You are ClearPath Assistant — a friendly, concise NHS cancer wait-time advisor. You talk like a knowledgeable friend, not a report. You also have basic medical knowledge about the cancer types covered by this app.

STYLE RULES (strict):
- Write in natural, flowing paragraphs. NO section headings, labels, or numbered steps.
- Never say words like "Acknowledge", "Recommend", "Mention", "Explain" as headings.
- Bold hospital names with **name**. Nothing else bolded.
- Keep the whole reply under 120 words. Shorter is better.
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

BASIC MEDICAL REFERENCE (use when users ask general questions about a cancer type):
- Breast: most common cancer in the UK. Symptoms include a lump, skin changes, or nipple discharge. Screening via mammogram every 3 years for women 50-71.
- Lung: strongly linked to smoking. Symptoms include persistent cough, breathlessness, chest pain, coughing up blood. Targeted screening for high-risk groups.
- Lower GI (colorectal/bowel): 4th most common UK cancer. Symptoms include blood in stool, changed bowel habits, unexplained weight loss. NHS screening every 2 years from age 60.
- Upper GI (oesophageal/stomach): symptoms include persistent indigestion, difficulty swallowing, unexplained weight loss, nausea.
- Urological (bladder/kidney): symptoms include blood in urine, lower back pain, frequent urination. Bladder cancer is more common in men.
- Prostate: most common cancer in men. Often slow-growing. Symptoms include difficulty urinating, weak flow, needing to urinate more often. PSA test available via GP.
- Skin: includes melanoma and non-melanoma types. Watch for new or changing moles — asymmetry, irregular border, colour variation, diameter >6mm, evolving shape (ABCDE rule).
- Gynaecological (ovarian/cervical/uterine): cervical screening (smear test) every 3-5 years for women 25-64. Symptoms include unusual bleeding, pelvic pain, bloating.
- Head & Neck: includes mouth, throat, larynx. Symptoms include persistent sore throat, difficulty swallowing, hoarseness, unexplained lump in neck. Linked to smoking and alcohol.
- Haematological (lymphoma/myeloma): symptoms include swollen lymph nodes, fatigue, unexplained weight loss, night sweats, recurrent infections.
- Acute Leukaemia: cancer of the blood. Symptoms include fatigue, frequent infections, unusual bleeding or bruising, bone pain. Requires urgent treatment.
- Brain/CNS: symptoms include persistent headaches (especially morning), seizures, vision/speech changes, personality changes, nausea.
- Sarcoma: rare cancers of bone or soft tissue. Symptoms include a growing lump (often painless), bone pain, swelling.
- Testicular: most common cancer in men aged 15-49. Symptoms include a painless lump or swelling in a testicle, dull ache in lower abdomen.
- Children's Cancer: includes leukaemia, brain tumours, lymphomas. Symptoms vary — persistent unexplained symptoms in children should always be checked by a GP.
- Non-Specific Symptoms: when cancer is suspected but the type is unclear. Referred via the Rapid Diagnostic Centre (RDC) pathway for faster investigation.

When answering medical questions:
- Give a brief, helpful overview using the reference above
- Always clarify you are not a doctor and this is general information from NHS sources
- Always end by encouraging them to speak with their GP for personal advice
- Never attempt to diagnose — describe common symptoms only

RULES:
- Never diagnose or give treatment advice
- End with a gentle nudge to discuss with their GP
- If no search results exist and they ask about wait times, tell them to use the search bar to find hospitals first`;

function buildSystemMessage(context?: Record<string, unknown>): string {
  let system = SYSTEM_PROMPT;
  if (!context) return system;

  const parts: string[] = [];
  if (context.cancer_type) parts.push(`Cancer type searched: ${context.cancer_type}`);
  if (context.postcode) parts.push(`Patient postcode: ${context.postcode}`);
  if (Array.isArray(context.results) && context.results.length) {
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
  return system;
}

function openaiChunk(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

/** Stream Anthropic SSE → OpenAI-compatible SSE */
function streamAnthropicResponse(response: Response): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
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
                controller.enqueue(encoder.encode(openaiChunk(parsed.delta.text)));
              }
            } catch { /* skip */ }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) { console.error('Stream error:', err); }
      finally { controller.close(); }
    },
  });
}

/** Stream Groq (already OpenAI-compatible) → pass through */
function streamGroqResponse(response: Response): ReadableStream {
  return response.body!;
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

export async function POST(request: NextRequest) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!anthropicKey && !groqKey) {
    return Response.json({ error: 'Chat service not configured' }, { status: 503 });
  }

  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Messages are required' }, { status: 400 });
    }

    const system = buildSystemMessage(context);
    const chatMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    // Try Anthropic first
    if (anthropicKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system,
            messages: chatMessages,
            stream: true,
          }),
        });

        if (response.ok) {
          return new Response(streamAnthropicResponse(response), { headers: SSE_HEADERS });
        }
        console.error('Anthropic API error:', response.status, await response.text().catch(() => ''));
      } catch (err) {
        console.error('Anthropic request failed:', err);
      }
    }

    // Fallback to Groq
    if (groqKey) {
      const groqMessages = [{ role: 'system', content: system }, ...chatMessages];
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: groqMessages,
          max_tokens: 1024,
          stream: true,
        }),
      });

      if (response.ok) {
        return new Response(streamGroqResponse(response), { headers: SSE_HEADERS });
      }
      console.error('Groq API error:', response.status, await response.text().catch(() => ''));
    }

    return Response.json({ error: 'Chat service unavailable' }, { status: 502 });
  } catch (error) {
    console.error('Chat route error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
