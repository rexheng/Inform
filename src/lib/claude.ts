import { LetterParams } from "./types";

export const LETTER_SYSTEM_PROMPT = `You are helping an NHS cancer patient exercise their legal right to request a transfer to a trust with a shorter waiting time. Write a clear, formal letter from the patient to their GP. The letter must:
- State the patient's current situation (condition, current trust, estimated wait)
- Name the alternative trust they are requesting and its current wait time
- Cite NHS Constitution patient choice rights (Section 2a)
- Request the GP to action a re-referral to the named trust
- Be under 200 words
- Be clinically neutral — do not imply the current trust is inadequate
- Be respectful and non-confrontational in tone
- End with space for the patient's name and date

Do not add any commentary outside the letter itself.`;

export function buildLetterPrompt(params: LetterParams): string {
  return `Patient situation:
- Name: ${params.patientName || "I"}
- Cancer type: ${params.cancerType}
- Current trust: ${params.currentTrust}
- Estimated current wait: ${params.currentWaitDays} days
- Requested trust: ${params.requestedTrust}
- Requested trust estimated wait: ${params.requestedWaitDays} days
- Patient postcode: ${params.postcode}

Write the transfer request letter.`;
}

export async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 500
): Promise<string> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userPrompt, maxTokens }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate letter. Please try again.");
  }

  const data = await response.json();
  return data.content;
}
