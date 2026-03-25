"use client";

import { useState } from "react";
import { Condition, CONDITIONS, ReferralType, REFERRAL_TYPES, Trust } from "@/lib/types";
import { getAllTrusts } from "@/lib/nhs";
import Spinner from "@/components/shared/Spinner";

interface PatientLookupProps {
  onSearch: (postcode: string, condition: Condition, referralType: ReferralType, trustCode: string) => Promise<void>;
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

const allTrusts = getAllTrusts().sort((a, b) => a.name.localeCompare(b.name));

export default function PatientLookup({ onSearch }: PatientLookupProps) {
  const [postcode, setPostcode] = useState("");
  const [condition, setCondition] = useState<Condition>("colorectal");
  const [referralType, setReferralType] = useState<ReferralType>("two-week-wait");
  const [trustCode, setTrustCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTrust = allTrusts.find((t) => t.code === trustCode);

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!postcode.trim()) {
      setError("Please enter your postcode.");
      return;
    }
    if (!trustCode) {
      setError("Please select the hospital you've been referred to.");
      return;
    }
    setError(null);
    setConfirming(true);
  }

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      await onSearch(postcode.trim(), condition, referralType, trustCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (confirming && selectedTrust) {
    const waitWeeks = selectedTrust.waits[condition];
    const conditionLabel = CONDITIONS.find((c) => c.value === condition)?.label ?? condition;
    const referralLabel = REFERRAL_TYPES.find((r) => r.value === referralType)?.label ?? referralType;

    return (
      <section className="py-2 flex flex-col gap-4">
        <h1 className="text-[1.75rem] font-extrabold tracking-[-0.04em] leading-[1.1] text-cp-dark">
          Confirm your<br />referral details
        </h1>

        {/* Summary card */}
        <div className="bg-cp-dark text-white rounded-[32px] p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-cp-mint font-medium">Your Referral</span>
            <span className="bg-cp-purple text-cp-dark text-[0.7rem] font-bold px-2.5 py-1 rounded-full">
              {referralLabel}
            </span>
          </div>
          <div className="text-[3.5rem] font-extrabold tracking-[-0.05em] leading-none mb-1 text-cp-lime">
            {waitWeeks} Weeks
          </div>
          <div className="text-[0.8rem] text-white/80 mt-2 pt-2 border-t border-white/15 space-y-1">
            <div><strong>Hospital:</strong> {selectedTrust.name}</div>
            <div><strong>Cancer type:</strong> {conditionLabel}</div>
            <div><strong>Postcode:</strong> {postcode.toUpperCase()}</div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>
        )}

        {loading ? (
          <Spinner message="Finding shorter waits nearby..." />
        ) : (
          <>
            <button
              onClick={handleConfirm}
              className="bg-cp-dark text-white border-none w-full py-4 rounded-full text-[0.9rem] font-bold flex justify-between items-center px-5 cursor-pointer"
            >
              Find shorter waits near me
              <ArrowIcon size={16} />
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="w-full py-3 rounded-full border-[1.5px] border-cp-dark text-cp-dark text-sm font-bold cursor-pointer bg-transparent"
            >
              Edit details
            </button>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="py-2">
      <h1 className="text-[1.75rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-2 text-cp-dark">
        Tell us about<br />your referral
      </h1>
      <p className="text-sm text-cp-text-muted mb-6">
        We&apos;ll check if a shorter wait is available at a nearby hospital.
      </p>

      <form onSubmit={handleReview} className="flex flex-col gap-4">
        {/* Hospital */}
        <div>
          <label htmlFor="trust" className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">
            Hospital you&apos;ve been referred to
          </label>
          <select
            id="trust"
            value={trustCode}
            onChange={(e) => setTrustCode(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-base text-cp-dark font-medium focus:border-cp-dark focus:outline-none appearance-none"
          >
            <option value="">Select hospital...</option>
            {allTrusts.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cancer type */}
        <div>
          <label htmlFor="condition" className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">
            Cancer type
          </label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as Condition)}
            className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-base text-cp-dark font-medium focus:border-cp-dark focus:outline-none appearance-none"
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Referral type */}
        <div>
          <label htmlFor="referralType" className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">
            Referral type
          </label>
          <select
            id="referralType"
            value={referralType}
            onChange={(e) => setReferralType(e.target.value as ReferralType)}
            className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-base text-cp-dark font-medium focus:border-cp-dark focus:outline-none appearance-none"
          >
            {REFERRAL_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Postcode */}
        <div>
          <label htmlFor="postcode" className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">
            Your postcode
          </label>
          <input
            id="postcode"
            type="text"
            placeholder="e.g. SE1 7QD"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
            className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-base text-cp-dark font-medium focus:border-cp-dark focus:outline-none"
            autoComplete="postal-code"
          />
          <p className="mt-1 text-[0.7rem] text-cp-text-muted">
            Used to find nearby hospitals. Not stored or logged.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="bg-cp-dark text-white border-none w-full py-4 rounded-full text-[0.9rem] font-bold flex justify-between items-center px-5 cursor-pointer"
        >
          Review my details
          <ArrowIcon size={16} />
        </button>
      </form>
    </section>
  );
}
