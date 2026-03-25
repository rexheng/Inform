"use client";

import { useState } from "react";
import { CANCER_TYPES, ReferralType, REFERRAL_TYPES, perfToWaitDays } from "@/lib/types";
import { trustInfo } from "@/map/data/trustInfo";
import Spinner from "@/components/shared/Spinner";

const hospitals = Object.entries(trustInfo)
  .map(([code, info]) => ({ code, ...info }))
  .sort((a, b) => {
    const nameA = a.website.replace(/https?:\/\/www\./, '').replace(/\.nhs\.uk.*/, '').replace(/\./g, ' ');
    const nameB = b.website.replace(/https?:\/\/www\./, '').replace(/\.nhs\.uk.*/, '').replace(/\./g, ' ');
    return nameA.localeCompare(nameB);
  });

// Friendly names derived from trustInfo websites
const HOSPITAL_NAMES: Record<string, string> = {
  R1H: "Barts Health NHS Trust",
  R1K: "London North West University Healthcare",
  RAL: "Royal Free London",
  RAN: "Royal National Orthopaedic Hospital",
  RAS: "The Hillingdon Hospitals",
  RAX: "Kingston and Richmond NHS",
  RF4: "Barking, Havering and Redbridge",
  RJ1: "Guy's and St Thomas'",
  RJ2: "Lewisham and Greenwich",
  RJ6: "Croydon Health Services",
  RJ7: "St George's University Hospitals",
  RJZ: "King's College Hospital",
  RKE: "Whittington Health",
  RP4: "Great Ormond Street Hospital",
  RP6: "Moorfields Eye Hospital",
  RPY: "The Royal Marsden",
  RQM: "Chelsea and Westminster Hospital",
  RQX: "Homerton Healthcare",
  RRV: "University College London Hospitals",
  RVR: "Epsom and St Helier",
  RYJ: "Imperial College Healthcare",
  NDA: "HCRG Care Group",
  NT3: "Spire Healthcare",
};

const sortedHospitals = Object.entries(HOSPITAL_NAMES).sort((a, b) => a[1].localeCompare(b[1]));

interface PatientLookupProps {
  onSearch: (postcode: string, cancerType: string, referralType: ReferralType, hospitalOds: string) => Promise<void>;
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function PatientLookup({ onSearch }: PatientLookupProps) {
  const [postcode, setPostcode] = useState("");
  const [cancerType, setCancerType] = useState("");
  const [referralType, setReferralType] = useState<ReferralType>("two-week-wait");
  const [hospitalOds, setHospitalOds] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedHospitalName = HOSPITAL_NAMES[hospitalOds] || hospitalOds;
  const selectedCancerLabel = CANCER_TYPES.find(c => c.value === cancerType)?.label ?? cancerType;

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!postcode.trim()) { setError("Please enter your postcode."); return; }
    if (!hospitalOds) { setError("Please select the hospital you've been referred to."); return; }
    if (!cancerType) { setError("Please select a cancer type."); return; }
    setError(null);
    setConfirming(true);
  }

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      await onSearch(postcode.trim(), cancerType, referralType, hospitalOds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (confirming) {
    const referralLabel = REFERRAL_TYPES.find(r => r.value === referralType)?.label ?? referralType;

    return (
      <section className="py-2 flex flex-col gap-4">
        <h1 className="text-[1.75rem] font-extrabold tracking-[-0.04em] leading-[1.1] text-cp-dark">
          Confirm your<br />referral details
        </h1>

        <div className="bg-cp-dark text-white rounded-[32px] p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-cp-mint font-medium">Your Referral</span>
            <span className="bg-cp-purple text-cp-dark text-[0.7rem] font-bold px-2.5 py-1 rounded-full">
              {referralLabel}
            </span>
          </div>
          <div className="text-[0.8rem] text-white/80 mt-2 pt-2 border-t border-white/15 space-y-1">
            <div><strong>Hospital:</strong> {selectedHospitalName}</div>
            <div><strong>Cancer type:</strong> {selectedCancerLabel}</div>
            <div><strong>Postcode:</strong> {postcode.toUpperCase()}</div>
          </div>
        </div>

        {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>}

        {loading ? (
          <Spinner message="Finding shorter waits nearby..." />
        ) : (
          <>
            <button onClick={handleConfirm} className="bg-cp-dark text-white border-none w-full py-4 rounded-full text-[0.9rem] font-bold flex justify-between items-center px-5 cursor-pointer">
              Find shorter waits near me
              <ArrowIcon size={16} />
            </button>
            <button onClick={() => setConfirming(false)} className="w-full py-3 rounded-full border-[1.5px] border-cp-dark text-cp-dark text-sm font-bold cursor-pointer bg-transparent">
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
        <div>
          <label htmlFor="trust" className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">
            Hospital you&apos;ve been referred to
          </label>
          <select id="trust" value={hospitalOds} onChange={(e) => setHospitalOds(e.target.value)} className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-base text-cp-dark font-medium focus:border-cp-dark focus:outline-none appearance-none">
            <option value="">Select hospital...</option>
            {sortedHospitals.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cancerType" className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">
            Cancer type
          </label>
          <select id="cancerType" value={cancerType} onChange={(e) => setCancerType(e.target.value)} className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-base text-cp-dark font-medium focus:border-cp-dark focus:outline-none appearance-none">
            <option value="">Select cancer type...</option>
            {CANCER_TYPES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="referralType" className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">
            Referral type
          </label>
          <select id="referralType" value={referralType} onChange={(e) => setReferralType(e.target.value as ReferralType)} className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-base text-cp-dark font-medium focus:border-cp-dark focus:outline-none appearance-none">
            {REFERRAL_TYPES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="postcode" className="block text-xs font-semibold uppercase tracking-[0.05em] text-cp-text-muted mb-1.5">
            Your postcode
          </label>
          <input id="postcode" type="text" placeholder="e.g. SE1 7QD" value={postcode} onChange={(e) => setPostcode(e.target.value.toUpperCase())} className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-base text-cp-dark font-medium focus:border-cp-dark focus:outline-none" autoComplete="postal-code" />
          <p className="mt-1 text-[0.7rem] text-cp-text-muted">Used to find nearby hospitals. Not stored or logged.</p>
        </div>

        {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>}

        <button type="submit" className="bg-cp-dark text-white border-none w-full py-4 rounded-full text-[0.9rem] font-bold flex justify-between items-center px-5 cursor-pointer">
          Review my details
          <ArrowIcon size={16} />
        </button>
      </form>
    </section>
  );
}
