import Link from "next/link";

function LocationIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="3" />
      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
    </svg>
  );
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="w-full max-w-[414px] min-h-screen flex flex-col bg-cp-bg shadow-[0_0_20px_rgba(0,0,0,0.05)]">
      {/* Top bar */}
      <header className="px-4 pt-4 pb-2 flex justify-between items-center sticky top-0 bg-cp-bg z-10">
        <div className="flex gap-2 items-center">
          <div className="bg-cp-lime text-cp-dark px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight flex items-center gap-1.5">
            NHS ClearPath
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-4 flex flex-col gap-6 pb-16">
        {/* Hero */}
        <section className="py-2">
          <h1 className="text-[1.75rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-4 text-cp-dark">
            Waiting too long<br />for cancer care?
          </h1>
          <p className="text-sm text-cp-text-muted mb-6">
            In London, wait times for the same cancer condition vary from{" "}
            <strong className="text-cp-dark">6 weeks</strong> to{" "}
            <strong className="text-cp-dark">17 weeks</strong> depending on which trust your GP refers you to.
          </p>

          {/* Stats card */}
          <div className="bg-cp-dark text-white rounded-[32px] p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-cp-mint font-medium">London Cancer Waits</span>
              <span className="bg-cp-purple text-cp-dark text-[0.7rem] font-bold px-2.5 py-1 rounded-full">
                NHS Target: 2 Wks
              </span>
            </div>
            <div className="text-[3.5rem] font-extrabold tracking-[-0.05em] leading-none mb-1 text-cp-lime">
              6–17 Wks
            </div>
            <div className="text-[0.8rem] text-white/80 mt-2 pt-2 border-t border-white/15">
              <strong>18</strong> London trusts &middot; <strong>11 week</strong> variation &middot; <strong>Section 2a</strong> right to choose
            </div>
          </div>
        </section>

        {/* What you can do */}
        <section>
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-xl font-extrabold tracking-[-0.02em]">What You Can Do</h2>
          </div>

          <div className="bg-white rounded-[20px] p-4 mb-2 border-[1.5px] border-cp-lime">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold leading-tight max-w-[80%]">Find shorter waits near you</h3>
              <ArrowIcon size={20} />
            </div>
            <div className="flex gap-4 mb-4">
              <div className="flex flex-col">
                <span className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] opacity-70">Compare</span>
                <span className="text-base font-bold">18 trusts</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] opacity-70">Coverage</span>
                <span className="text-base font-bold">All London</span>
              </div>
            </div>
            <Link
              href="/patient"
              className="inline-flex items-center bg-cp-dark text-cp-lime px-3 py-1.5 rounded-full text-[0.8rem] font-semibold gap-1.5"
            >
              Check your wait <ArrowIcon size={12} />
            </Link>
          </div>
        </section>

        {/* Your Rights edu card */}
        <section>
          <div className="bg-cp-purple rounded-[32px] p-6">
            <h2 className="text-xl font-extrabold mb-2 leading-tight">
              Your NHS Right<br />to Choose
            </h2>
            <p className="text-sm font-medium mb-4 opacity-90">
              If you have been waiting over 2 weeks for a suspected cancer referral, you have a legal right to request a transfer to a hospital with a shorter list.
            </p>
            <Link
              href="/patient"
              className="bg-cp-dark text-white border-none w-full py-4 rounded-full text-[0.9rem] font-bold flex justify-between items-center px-5"
            >
              Find shorter waits near me
              <ArrowIcon size={16} />
            </Link>
          </div>
        </section>

        {/* Footer disclaimer */}
        <footer className="text-center text-xs text-cp-text-muted pt-4 pb-2">
          <p>
            Data based on NHS England Cancer Waiting Times statistics. ClearPath is a demonstration
            project &mdash; it does not store patient data or make clinical recommendations.
          </p>
          <p className="mt-1">LSE Claude Builder Club Hackathon, March 2026</p>
        </footer>
      </main>
    </div>
  );
}
