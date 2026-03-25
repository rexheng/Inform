import { NextRequest, NextResponse } from "next/server";

const MOCK_LETTER = `Dear Dr [GP Name],

I am writing to request a re-referral for my cancer care. I was referred to [Current Trust] for investigation and treatment of [condition] cancer, and I have now been waiting [weeks] weeks for my appointment.

I understand that under the NHS Constitution (Section 2a), I have the right to choose which NHS trust I am referred to for my first outpatient appointment. Having reviewed publicly available NHS waiting time data, I note that [Requested Trust] currently has a waiting time of [requested weeks] weeks for the same pathway.

I would be grateful if you could arrange a re-referral to [Requested Trust] so that I may receive timely diagnosis and treatment. I appreciate that clinical suitability must be considered, and I am happy to discuss this at your earliest convenience.

Thank you for your continued support with my care.

Yours sincerely,

[Your name]
[Date]`;

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, userPrompt, maxTokens } = await request.json();

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: "Missing systemPrompt or userPrompt" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If no API key, return a realistic mock letter
    if (!apiKey) {
      // Parse details from userPrompt to personalize the mock
      const nameMatch = userPrompt.match(/Name:\s*(.+)/);
      const conditionMatch = userPrompt.match(/Condition:\s*(.+)/);
      const currentMatch = userPrompt.match(/Current trust:\s*(.+)/);
      const weeksMatch = userPrompt.match(/Weeks waiting:\s*(\d+)/);
      const requestedMatch = userPrompt.match(/Requested trust:\s*(.+)/);
      const requestedWeeksMatch = userPrompt.match(/Requested trust wait time:\s*(\d+)/);
      const postcodeMatch = userPrompt.match(/Patient postcode:\s*(.+)/);

      const patientName = nameMatch?.[1]?.trim() || "I";
      const condition = conditionMatch?.[1]?.trim() || "colorectal";
      const currentTrust = currentMatch?.[1]?.trim() || "my current trust";
      const weeks = weeksMatch?.[1]?.trim() || "14";
      const requestedTrust = requestedMatch?.[1]?.trim() || "the alternative trust";
      const requestedWeeks = requestedWeeksMatch?.[1]?.trim() || "6";
      const postcode = postcodeMatch?.[1]?.trim() || "";

      const letter = `Dear Dr [GP Name],

I am writing to request a re-referral for my cancer care. I was referred to ${currentTrust} for investigation and treatment of ${condition} cancer, and I have now been waiting ${weeks} weeks for my appointment.

I understand that under the NHS Constitution (Section 2a), I have the right to choose which NHS trust I am referred to for my first outpatient appointment. Having reviewed publicly available NHS waiting time data, I note that ${requestedTrust} currently has a waiting time of approximately ${requestedWeeks} weeks for the same pathway.

I would be grateful if you could arrange a re-referral to ${requestedTrust} so that I may receive timely diagnosis and treatment. I appreciate that clinical suitability must be considered, and I am happy to discuss this at your earliest convenience.

Thank you for your continued support with my care.

Yours sincerely,

${patientName === "I" ? "[Your name]" : patientName}
[Date]`;

      return NextResponse.json({ content: letter });
    }

    // Real Claude API call
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens || 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Anthropic API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate content" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
