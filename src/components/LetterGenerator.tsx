"use client";

import { useState } from "react";
import { Trust, TrustWithDistance, Condition, LetterParams } from "@/lib/types";
import { generateWithClaude, LETTER_SYSTEM_PROMPT, buildLetterPrompt } from "@/lib/claude";
import Spinner from "@/components/shared/Spinner";

interface LetterGeneratorProps {
  currentTrust: Trust;
  selectedTrust: TrustWithDistance;
  condition: Condition;
  postcode: string;
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function LetterGenerator({
  currentTrust,
  selectedTrust,
  condition,
  postcode,
}: LetterGeneratorProps) {
  const [name, setName] = useState("");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    setCopied(false);

    const params: LetterParams = {
      patientName: name || "I",
      condition,
      currentTrust: currentTrust.name,
      weeksWaiting: currentTrust.waits[condition],
      requestedTrust: selectedTrust.name,
      requestedWaitTime: selectedTrust.waits[condition],
      postcode,
    };

    try {
      const content = await generateWithClaude(
        LETTER_SYSTEM_PROMPT,
        buildLetterPrompt(params),
        500
      );
      setLetter(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate letter.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy. Please select and copy manually.");
    }
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Transfer Request Letter</title>
          <style>body { font-family: system-ui, sans-serif; padding: 40px; line-height: 1.6; white-space: pre-wrap; }</style>
          </head>
          <body>${letter}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="py-2">
        <h1 className="text-[1.75rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-2 text-cp-dark">
          Generate your<br />transfer request
        </h1>
        <p className="text-sm text-cp-text-muted">
          This letter will ask your GP to re-refer you to{" "}
          <strong className="text-cp-dark">{selectedTrust.name}</strong> ({selectedTrust.waits[condition]} weeks wait).
        </p>
      </section>

      {/* Safeguard copy — required, do not remove */}
      <div className="bg-white/80 rounded-2xl border-[1.5px] border-cp-border p-3 text-xs text-cp-text-muted">
        Wait times are indicative based on monthly NHS data. Clinical suitability should always be
        discussed with your GP. Staying with your current trust is always a valid choice.
      </div>

      {!letter && (
        <>
          <div>
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">
              Your name (optional)
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Sarah Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-base text-cp-dark font-medium focus:border-cp-dark focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>
          )}

          {loading ? (
            <Spinner message="Generating your letter..." />
          ) : (
            <button
              onClick={handleGenerate}
              className="bg-cp-dark text-white border-none w-full py-4 rounded-full text-[0.9rem] font-bold flex justify-between items-center px-5 cursor-pointer"
            >
              Generate my transfer request letter
              <ArrowIcon size={16} />
            </button>
          )}
        </>
      )}

      {letter && (
        <>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">
              Your letter (edit as needed)
            </label>
            <textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              rows={14}
              className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-sm leading-relaxed text-cp-dark focus:border-cp-dark focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handleCopy}
              className="bg-cp-dark text-white border-none w-full py-4 rounded-full text-[0.9rem] font-bold flex justify-center items-center px-5 cursor-pointer"
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 rounded-full border-[1.5px] border-cp-dark text-cp-dark text-sm font-bold cursor-pointer bg-transparent"
              >
                Print
              </button>
              <button
                onClick={() => {
                  setLetter("");
                  setCopied(false);
                }}
                className="flex-1 py-3 rounded-full border-[1.5px] border-cp-border text-cp-text-muted text-sm font-bold cursor-pointer bg-transparent"
              >
                Regenerate
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
