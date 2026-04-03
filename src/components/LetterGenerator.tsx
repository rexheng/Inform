"use client";

import { useState } from "react";
import { SearchResult, LetterParams, perfToWaitDays } from "@/lib/types";
import { generateWithClaude, LETTER_SYSTEM_PROMPT, buildLetterPrompt } from "@/lib/claude";
import Spinner from "@/components/shared/Spinner";

interface LetterGeneratorProps {
  currentHospital: SearchResult;
  selectedHospital: SearchResult;
  cancerType: string;
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
  currentHospital,
  selectedHospital,
  cancerType,
  postcode,
}: LetterGeneratorProps) {
  const [name, setName] = useState("");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentDays = perfToWaitDays(currentHospital.performance_fds);
  const selectedDays = perfToWaitDays(selectedHospital.performance_fds);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    setCopied(false);

    const params: LetterParams = {
      patientName: name || "I",
      cancerType,
      currentTrust: currentHospital.name,
      currentWaitDays: currentDays,
      requestedTrust: selectedHospital.name,
      requestedWaitDays: selectedDays,
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
    if (!printWindow) return;

    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    // Escape HTML and convert line breaks to paragraphs
    const escaped = letter
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const paragraphs = escaped
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Transfer Request Letter — ClearPath</title>
<style>
  @page { size: A4; margin: 20mm 25mm 25mm 25mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1a1a1a;
    font-size: 11pt;
    line-height: 1.65;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 20px;
    border-bottom: 2.5px solid #0A3B2A;
    margin-bottom: 32px;
  }
  .logo-area { display: flex; align-items: center; gap: 10px; }
  .logo-mark {
    width: 36px; height: 36px;
    background: #D9FA58;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .logo-mark svg { width: 20px; height: 20px; }
  .logo-text {
    font-size: 18pt;
    font-weight: 800;
    color: #0A3B2A;
    letter-spacing: -0.03em;
  }
  .logo-sub {
    font-size: 8pt;
    color: #537566;
    font-weight: 500;
    letter-spacing: 0.02em;
    margin-top: 1px;
  }
  .header-date {
    text-align: right;
    font-size: 9.5pt;
    color: #537566;
    line-height: 1.5;
  }

  .letter-body { margin-bottom: 40px; }
  .letter-body p {
    margin-bottom: 14px;
    text-align: left;
  }

  .footer {
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid #e0e5e3;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8pt;
    color: #537566;
  }
  .footer-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #F4F7F5;
    border-radius: 20px;
    padding: 4px 10px;
    font-weight: 600;
    color: #0A3B2A;
    font-size: 7.5pt;
  }
  .footer-badge span {
    width: 6px; height: 6px;
    background: #D9FA58;
    border-radius: 50%;
    display: inline-block;
  }

  @media screen {
    body { max-width: 210mm; margin: 20px auto; padding: 20mm 25mm; background: #f5f5f5; }
    body > div { background: white; padding: 40px 50px; border-radius: 8px; box-shadow: 0 2px 20px rgba(0,0,0,0.08); min-height: 277mm; display: flex; flex-direction: column; }
    .letter-body { flex: 1; }
  }
</style>
</head>
<body>
<div>
  <div class="header">
    <div>
      <div class="logo-area">
        <div class="logo-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0A3B2A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
        <div>
          <div class="logo-text">ClearPath</div>
          <div class="logo-sub">NHS Cancer Wait Time Navigator</div>
        </div>
      </div>
    </div>
    <div class="header-date">
      ${today}<br/>
      Transfer Request Letter
    </div>
  </div>

  <div class="letter-body">
    ${paragraphs}
  </div>

  <div class="footer">
    <div>Generated via ClearPath &middot; clearpath.health &middot; Data sourced from NHS England Cancer Waiting Times statistics</div>
    <div class="footer-badge"><span></span> ClearPath</div>
  </div>
</div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="py-2">
        <h1 className="text-[1.75rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-2 text-cp-dark">
          Generate your<br />transfer request
        </h1>
        <p className="text-sm text-cp-text-muted">
          This letter will ask your GP to re-refer you to{" "}
          <strong className="text-cp-dark">{selectedHospital.name}</strong> (~{selectedDays} days wait).
        </p>
      </section>

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
            <input id="name" type="text" placeholder="e.g. Sarah Chen" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-base text-cp-dark font-medium focus:border-cp-dark focus:outline-none" />
          </div>

          {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>}

          {loading ? (
            <Spinner message="Generating your letter..." />
          ) : (
            <button onClick={handleGenerate} className="bg-cp-dark text-white border-none w-full py-4 rounded-full text-[0.9rem] font-bold flex justify-between items-center px-5 cursor-pointer">
              Generate my transfer request letter
              <ArrowIcon size={16} />
            </button>
          )}
        </>
      )}

      {letter && (
        <>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">Your letter (edit as needed)</label>
            <textarea value={letter} onChange={(e) => setLetter(e.target.value)} rows={14} className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-sm leading-relaxed text-cp-dark focus:border-cp-dark focus:outline-none" />
          </div>

          {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>}

          <div className="flex flex-col gap-2">
            <button onClick={handleCopy} className="bg-cp-dark text-white border-none w-full py-4 rounded-full text-[0.9rem] font-bold flex justify-center items-center px-5 cursor-pointer">
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="flex-1 py-3 rounded-full border-[1.5px] border-cp-dark text-cp-dark text-sm font-bold cursor-pointer bg-transparent">Print</button>
              <button onClick={() => { setLetter(""); setCopied(false); }} className="flex-1 py-3 rounded-full border-[1.5px] border-cp-border text-cp-text-muted text-sm font-bold cursor-pointer bg-transparent">Regenerate</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
