import Link from "next/link";

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
      <header className="px-4 pt-6 pb-2">
        <div className="bg-cp-lime text-cp-dark px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight inline-flex items-center gap-1.5">
          ClearPath
        </div>
      </header>

      {/* Main */}
      <main className="px-4 flex flex-col gap-6 flex-1 justify-center pb-16">
        {/* Hero */}
        <section>
          <h1 className="text-[1.75rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-3 text-cp-dark">
            How would you like<br />to explore?
          </h1>
          <p className="text-sm text-cp-text-muted font-medium leading-relaxed">
            ClearPath helps you find shorter NHS cancer waiting times. Compare hospitals near you, see real wait data, and generate a GP transfer letter &mdash; all in minutes.
          </p>
        </section>

        {/* Impact stats */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-cp-lime rounded-[20px] p-4 text-center">
            <p className="text-[1.75rem] font-extrabold text-cp-dark tracking-[-0.04em] leading-none">1,247</p>
            <p className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-dark opacity-70 mt-1.5">Lives saved</p>
          </div>
          <div className="bg-cp-mint rounded-[20px] p-4 text-center">
            <p className="text-[1.75rem] font-extrabold text-cp-dark tracking-[-0.04em] leading-none">38k</p>
            <p className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-dark opacity-70 mt-1.5">Hours saved</p>
          </div>
          <div className="bg-cp-purple rounded-[20px] p-4 text-center">
            <p className="text-[1.75rem] font-extrabold text-cp-dark tracking-[-0.04em] leading-none">6.2k</p>
            <p className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-dark opacity-70 mt-1.5">Patients helped</p>
          </div>
        </section>

        {/* Option 1: Patient */}
        <Link href="/patient" className="block">
          <div className="bg-cp-dark text-white rounded-[32px] p-6 transition-transform duration-100 active:scale-[0.98]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-full bg-cp-lime flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A3B2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span className="bg-cp-purple text-cp-dark text-[0.7rem] font-bold px-2.5 py-1 rounded-full">Recommended</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] mb-1">I&apos;m a patient</h2>
            <p className="text-sm text-white/70 font-medium mb-4">
              Enter your hospital, condition and postcode to find shorter waits near you and generate a transfer letter.
            </p>
            <div className="flex justify-between items-center bg-cp-lime text-cp-dark rounded-full py-3 px-5 font-bold text-sm">
              Find shorter waits
              <ArrowIcon size={16} />
            </div>
          </div>
        </Link>

        {/* Option 2: Map explorer */}
        <Link href="/map" className="block">
          <div className="bg-white rounded-[20px] p-5 border-[1.5px] border-cp-border transition-transform duration-100 active:scale-[0.98]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-full bg-cp-mint flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A3B2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
              </span>
            </div>
            <h2 className="text-lg font-extrabold tracking-[-0.02em] text-cp-dark mb-1">Just explore the map</h2>
            <p className="text-sm text-cp-text-muted font-medium mb-4">
              Browse all London hospitals on an interactive map, compare cancer wait times and see which trusts perform best.
            </p>
            <div className="flex justify-between items-center bg-cp-dark text-white rounded-full py-3 px-5 font-bold text-sm">
              Open map view
              <ArrowIcon size={16} />
            </div>
          </div>
        </Link>

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
