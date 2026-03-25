"use client";

import { useState } from "react";
import { ReferralType, SearchResult, SearchResponse, PatientContext, CANCER_TYPES } from "@/lib/types";
import PatientLookup from "@/components/PatientLookup";
import WaitComparison from "@/components/WaitComparison";
import RightsPanel from "@/components/RightsPanel";
import LetterGenerator from "@/components/LetterGenerator";

type Step = "lookup" | "comparison" | "letter";

function LocationIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="3" />
      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
    </svg>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function PatientPage() {
  const [step, setStep] = useState<Step>("lookup");
  const [context, setContext] = useState<PatientContext | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [borough, setBorough] = useState<string | null>(null);

  async function handleSearch(postcode: string, cancerType: string, referralType: ReferralType, hospitalOds: string) {
    const ct = encodeURIComponent(cancerType);
    const pc = encodeURIComponent(postcode);
    const resp = await fetch(`${API_BASE}/search?cancer_type=${ct}&postcode=${pc}`);
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.detail || `Search failed (${resp.status})`);
    }
    const data: SearchResponse = await resp.json();

    const currentHospital = data.results.find(r => r.ods_code === hospitalOds);
    if (!currentHospital) {
      throw new Error("Your hospital was not found in results for this cancer type. It may not treat this condition.");
    }

    const alternatives = data.results
      .filter(r => r.ods_code !== hospitalOds)
      .sort((a, b) => (b.performance_fds ?? 0) - (a.performance_fds ?? 0));

    const cancerLabel = CANCER_TYPES.find(c => c.value === cancerType)?.label ?? cancerType;

    setContext({ postcode, cancerType, cancerLabel, referralType, currentHospital, alternatives });
    setBorough(data.postcode);
    setStep("comparison");
  }

  function handleSelectResult(result: SearchResult) {
    setSelectedResult(result);
    setStep("letter");
  }

  function handleBack() {
    if (step === "letter") {
      setSelectedResult(null);
      setStep("comparison");
    } else {
      setContext(null);
      setStep("lookup");
    }
  }

  return (
    <div className="w-full max-w-[414px] min-h-screen flex flex-col bg-cp-bg shadow-[0_0_20px_rgba(0,0,0,0.05)]">
      <header className="px-4 pt-4 pb-2 flex justify-between items-center sticky top-0 bg-cp-bg z-10">
        <div className="flex gap-2 items-center">
          <a href="/" className="bg-cp-lime text-cp-dark px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight flex items-center gap-1.5">
            ClearPath
          </a>
          {borough && (
            <div className="bg-transparent border-[1.5px] border-cp-dark text-cp-dark px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight flex items-center gap-1.5">
              <LocationIcon />
              {borough}
            </div>
          )}
        </div>
        {step !== "lookup" && (
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-cp-dark text-cp-lime border-none text-[0.7rem] font-bold flex items-center justify-center cursor-pointer"
            aria-label="Back"
          >
            Back
          </button>
        )}
      </header>

      <main className="px-4 flex flex-col gap-6 pb-16">
        {step === "lookup" && <PatientLookup onSearch={handleSearch} />}

        {step === "comparison" && context && (
          <>
            <WaitComparison
              currentHospital={context.currentHospital}
              cancerLabel={context.cancerLabel}
              alternatives={context.alternatives}
              onSelectResult={handleSelectResult}
            />
            <RightsPanel currentHospital={context.currentHospital} />
          </>
        )}

        {step === "letter" && context && selectedResult && (
          <>
            <LetterGenerator
              currentHospital={context.currentHospital}
              selectedHospital={selectedResult}
              cancerType={context.cancerLabel}
              postcode={context.postcode}
            />
            <RightsPanel currentHospital={context.currentHospital} />
          </>
        )}
      </main>

      <footer className="mt-auto text-center text-xs text-cp-text-muted px-4 py-4">
        <p>Data based on NHS England Cancer Waiting Times statistics. Wait times are indicative and updated monthly.</p>
        <p className="mt-1">LSE Claude Builder Club Hackathon, March 2026</p>
      </footer>
    </div>
  );
}
