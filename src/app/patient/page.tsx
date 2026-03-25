"use client";

import { useState } from "react";
import { Condition, ReferralType, TrustWithDistance, PatientContext } from "@/lib/types";
import { lookupPostcode } from "@/lib/postcodes";
import { getTrustByCode, getNearbyAlternatives } from "@/lib/nhs";
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

export default function PatientPage() {
  const [step, setStep] = useState<Step>("lookup");
  const [context, setContext] = useState<PatientContext | null>(null);
  const [selectedTrust, setSelectedTrust] = useState<TrustWithDistance | null>(null);

  async function handleSearch(postcode: string, condition: Condition, referralType: ReferralType, trustCode: string) {
    const location = await lookupPostcode(postcode);
    const currentTrust = getTrustByCode(trustCode);
    if (!currentTrust) {
      throw new Error("Selected hospital not found.");
    }

    const alternatives = getNearbyAlternatives(
      location.lat,
      location.lng,
      condition,
      currentTrust.code
    );

    setContext({ postcode, condition, referralType, location, currentTrust, alternatives });
    setStep("comparison");
  }

  function handleSelectTrust(trust: TrustWithDistance) {
    setSelectedTrust(trust);
    setStep("letter");
  }

  function handleBack() {
    if (step === "letter") {
      setSelectedTrust(null);
      setStep("comparison");
    } else {
      setContext(null);
      setStep("lookup");
    }
  }

  return (
    <div className="w-full max-w-[414px] min-h-screen flex flex-col bg-cp-bg shadow-[0_0_20px_rgba(0,0,0,0.05)]">
      {/* Top bar */}
      <header className="px-4 pt-4 pb-2 flex justify-between items-center sticky top-0 bg-cp-bg z-10">
        <div className="flex gap-2 items-center">
          <a href="/" className="bg-cp-lime text-cp-dark px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight flex items-center gap-1.5">
            NHS ClearPath
          </a>
          {context?.location?.borough && (
            <div className="bg-transparent border-[1.5px] border-cp-dark text-cp-dark px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight flex items-center gap-1.5">
              <LocationIcon />
              {context.location.borough}
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

      {/* Main content */}
      <main className="px-4 flex flex-col gap-6 pb-16">
        {step === "lookup" && <PatientLookup onSearch={handleSearch} />}

        {step === "comparison" && context && (
          <>
            <WaitComparison
              currentTrust={context.currentTrust}
              condition={context.condition}
              alternatives={context.alternatives}
              onSelectTrust={handleSelectTrust}
            />
            <RightsPanel
              currentTrust={context.currentTrust}
              condition={context.condition}
            />
          </>
        )}

        {step === "letter" && context && selectedTrust && (
          <>
            <LetterGenerator
              currentTrust={context.currentTrust}
              selectedTrust={selectedTrust}
              condition={context.condition}
              postcode={context.postcode}
            />
            <RightsPanel
              currentTrust={context.currentTrust}
              condition={context.condition}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto text-center text-xs text-cp-text-muted px-4 py-4">
        <p>
          Data based on NHS England Cancer Waiting Times statistics. Wait times are indicative and updated monthly.
        </p>
        <p className="mt-1">LSE Claude Builder Club Hackathon, March 2026</p>
      </footer>
    </div>
  );
}
