"use client";

import { useState } from "react";
import { SearchResult, perfToWaitDays } from "@/lib/types";

interface WaitComparisonProps {
  currentHospital: SearchResult;
  cancerLabel: string;
  alternatives: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
}

function ArrowIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function kmToMiles(km: number): string {
  return (km * 0.621371).toFixed(1);
}

export default function WaitComparison({
  currentHospital,
  cancerLabel,
  alternatives,
  onSelectResult,
}: WaitComparisonProps) {
  const currentDays = perfToWaitDays(currentHospital.performance_fds);
  const currentWeeks = Math.round(currentDays / 7);
  const bestAlt = alternatives[0];
  const bestAltDays = bestAlt ? perfToWaitDays(bestAlt.performance_fds) : currentDays;
  const bestAltWeeks = Math.round(bestAltDays / 7);
  const weeksSaved = currentWeeks - bestAltWeeks;

  return (
    <div className="flex flex-col gap-6">
      <section className="py-2">
        <h1 className="text-[1.75rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-4 text-cp-dark">
          Here is your<br />referral status.
        </h1>

        <div className="bg-cp-dark text-white rounded-[32px] p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-cp-mint font-medium">Current Estimated Wait</span>
            <span className="bg-cp-purple text-cp-dark text-[0.7rem] font-bold px-2.5 py-1 rounded-full">
              NHS Target: 4 Wks
            </span>
          </div>
          <div className="text-[3.5rem] font-extrabold tracking-[-0.05em] leading-none mb-1 text-cp-lime">
            {currentDays} Days
          </div>
          <div className="text-[0.8rem] text-white/80 mt-2 pt-2 border-t border-white/15">
            <strong>Referral:</strong> {cancerLabel}<br />
            <strong>Hospital:</strong> {currentHospital.name}
            {currentHospital.performance_fds !== null && (
              <><br /><strong>Performance:</strong> {Math.round(currentHospital.performance_fds * 100)}% seen within target</>
            )}
          </div>
        </div>
      </section>

      {alternatives.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-xl font-extrabold tracking-[-0.02em]">Shorter Waits Near You</h2>
          </div>

          {alternatives.slice(0, 4).map((alt, i) => {
            const altDays = perfToWaitDays(alt.performance_fds);
            const saved = currentDays - altDays;

            return (
              <OptionCard
                key={alt.ods_code}
                recommended={i === 0}
                hospitalName={alt.name}
                waitTime={`${altDays} days`}
                travel={`${kmToMiles(alt.distance_km)} mi`}
                savings={saved > 0 ? `${saved} days` : undefined}
                performance={alt.performance_fds}
                onPress={() => onSelectResult(alt)}
              />
            );
          })}
        </section>
      )}

      {bestAlt && weeksSaved > 0 && (
        <section>
          <h2 className="text-base font-extrabold tracking-[-0.02em] mb-3">Impact Summary</h2>
          <div className="flex bg-white rounded-[20px] overflow-hidden">
            <div className="flex-1 p-4 flex flex-col items-center text-center">
              <span className="text-xs font-bold mb-1 opacity-80">If you stay</span>
              <span className="text-2xl font-extrabold tracking-[-0.03em]">{currentDays}d</span>
            </div>
            <div className="w-[2px] bg-cp-bg relative flex items-center justify-center">
              <span className="bg-cp-dark text-white text-[0.6rem] font-bold p-1 rounded-full absolute z-[2]">VS</span>
            </div>
            <div className="flex-1 p-4 flex flex-col items-center text-center bg-cp-mint">
              <span className="text-xs font-bold mb-1 opacity-80">If you switch</span>
              <span className="text-2xl font-extrabold tracking-[-0.03em]">{bestAltDays}d</span>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-extrabold tracking-[-0.02em] mb-3">What You Can Do</h2>

        {bestAlt && weeksSaved > 0 && (
          <button onClick={() => onSelectResult(bestAlt)} className="bg-cp-dark text-white border-none w-full py-4 rounded-full text-[0.9rem] font-bold flex justify-between items-center px-5 cursor-pointer mb-2">
            <span>Generate transfer request letter</span>
            <ArrowIcon size={16} />
          </button>
        )}

        <a href="tel:111" className="bg-white w-full py-4 rounded-[20px] text-[0.9rem] font-bold flex items-center px-5 mb-2 border-[1.5px] border-transparent">
          <span className="w-10 h-10 rounded-full bg-cp-mint flex items-center justify-center mr-3 shrink-0"><PhoneIcon /></span>
          <span className="flex flex-col text-left">
            <span className="text-cp-dark">Call NHS 111</span>
            <span className="text-[0.7rem] font-medium text-cp-text-muted">Discuss your options with an adviser</span>
          </span>
        </a>

        <a href="tel:08009530667" className="bg-white w-full py-4 rounded-[20px] text-[0.9rem] font-bold flex items-center px-5 mb-2 border-[1.5px] border-transparent">
          <span className="w-10 h-10 rounded-full bg-cp-purple flex items-center justify-center mr-3 shrink-0"><PhoneIcon /></span>
          <span className="flex flex-col text-left">
            <span className="text-cp-dark">Call PALS</span>
            <span className="text-[0.7rem] font-medium text-cp-text-muted">Patient Advice &amp; Liaison — 0800 953 0667</span>
          </span>
        </a>

        <button
          onClick={() => {
            const summary = [
              `ClearPath — Wait Time Summary`,
              `Generated: ${new Date().toLocaleDateString("en-GB")}`,
              ``,
              `Current Hospital: ${currentHospital.name}`,
              `Cancer Type: ${cancerLabel}`,
              `Current Wait: ~${currentDays} days`,
              ``,
              `Nearby Alternatives:`,
              ...alternatives.slice(0, 4).map(alt => `  • ${alt.name} — ~${perfToWaitDays(alt.performance_fds)} days (${kmToMiles(alt.distance_km)} mi)`),
              ``,
              `Your NHS Right: Under Section 2a of the NHS Constitution, you can request a referral to a different hospital.`,
            ].join("\n");
            const blob = new Blob([summary], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "clearpath-summary.txt"; a.click();
            URL.revokeObjectURL(url);
          }}
          className="bg-white w-full py-4 rounded-[20px] text-[0.9rem] font-bold flex items-center px-5 mb-2 border-[1.5px] border-transparent cursor-pointer"
        >
          <span className="w-10 h-10 rounded-full bg-cp-lime flex items-center justify-center mr-3 shrink-0"><DownloadIcon /></span>
          <span className="flex flex-col text-left">
            <span className="text-cp-dark">Download summary</span>
            <span className="text-[0.7rem] font-medium text-cp-text-muted">Save your wait time comparison</span>
          </span>
        </button>

        <button
          onClick={() => {
            const subject = encodeURIComponent("ClearPath — My Cancer Wait Time Options");
            const body = encodeURIComponent(`Dear Doctor,\n\nI have been referred to ${currentHospital.name} for ${cancerLabel.toLowerCase()}, with an estimated wait of ~${currentDays} days.\n\nI have found that ${bestAlt?.name ?? "another hospital"} has an estimated wait of ~${bestAlt ? perfToWaitDays(bestAlt.performance_fds) : "fewer"} days.\n\nUnder Section 2a of the NHS Constitution, I would like to discuss the possibility of being re-referred.\n\nThank you.`);
            window.open(`mailto:?subject=${subject}&body=${body}`);
          }}
          className="bg-white w-full py-4 rounded-[20px] text-[0.9rem] font-bold flex items-center px-5 mb-2 border-[1.5px] border-transparent cursor-pointer"
        >
          <span className="w-10 h-10 rounded-full bg-cp-bg flex items-center justify-center mr-3 shrink-0 border-[1.5px] border-cp-border"><EmailIcon /></span>
          <span className="flex flex-col text-left">
            <span className="text-cp-dark">Email your GP</span>
            <span className="text-[0.7rem] font-medium text-cp-text-muted">Draft an email with your options</span>
          </span>
        </button>
      </section>
    </div>
  );
}

function OptionCard({ recommended, hospitalName, waitTime, travel, savings, performance, onPress }: {
  recommended?: boolean; hospitalName: string; waitTime: string; travel: string; savings?: string; performance: number | null; onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const pct = performance !== null ? Math.round(performance * 100) : null;

  return (
    <div
      className={`rounded-[20px] p-4 mb-2 border-[1.5px] cursor-pointer transition-transform duration-100 ${recommended ? "bg-cp-lime border-cp-lime" : "bg-white border-transparent"}`}
      style={{ transform: pressed ? "scale(0.98)" : "scale(1)" }}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      onClick={onPress}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold leading-tight max-w-[80%]">{hospitalName}</h3>
        <ArrowIcon size={20} />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="flex flex-col">
          <span className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] opacity-70">Wait</span>
          <span className="text-base font-bold">{waitTime}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] opacity-70">Distance</span>
          <span className="text-base font-bold">{travel}</span>
        </div>
        {pct !== null && (
          <div className="flex flex-col">
            <span className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] opacity-70">On time</span>
            <span className="text-base font-bold">{pct}%</span>
          </div>
        )}
      </div>
      {savings && (
        <div className="inline-flex items-center bg-cp-dark text-cp-lime px-3 py-1.5 rounded-full text-[0.8rem] font-semibold">
          Saves you {savings}
        </div>
      )}
    </div>
  );
}
