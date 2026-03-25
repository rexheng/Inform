import { SearchResult, perfToWaitDays } from "@/lib/types";

interface RightsPanelProps {
  currentHospital: SearchResult;
}

export default function RightsPanel({ currentHospital }: RightsPanelProps) {
  const waitDays = perfToWaitDays(currentHospital.performance_fds);
  const pct = currentHospital.performance_fds !== null ? Math.round(currentHospital.performance_fds * 100) : null;
  const breached = pct !== null && pct < 75;

  return (
    <div className="bg-cp-purple rounded-[32px] p-6">
      <h2 className="text-xl font-extrabold mb-2 leading-tight">
        Your NHS Right<br />to Choose
      </h2>
      <p className="text-sm font-medium mb-4 opacity-90">
        If you have been waiting over 2 weeks for a suspected cancer referral, you have a legal right to request a transfer to a hospital with a shorter list.
      </p>

      {/* Performance status */}
      <div className="bg-white/30 rounded-2xl p-4 mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${breached ? "bg-red-500" : "bg-green-600"}`}>
            {breached ? "!" : "\u2713"}
          </span>
          <span className="text-sm font-medium">
            <strong>28-day faster diagnosis:</strong>{" "}
            {breached ? (
              <span className="text-red-800">Below target ({pct}% on time, ~{waitDays} day wait)</span>
            ) : pct !== null ? (
              <span className="text-green-800">On track ({pct}% on time)</span>
            ) : (
              <span className="text-gray-600">No data available</span>
            )}
          </span>
        </div>
      </div>

      {/* NHS Constitution */}
      <div className="bg-white/20 rounded-2xl p-4 mb-4">
        <p className="text-sm font-bold mb-1">NHS Constitution &mdash; Section 2a</p>
        <p className="text-sm opacity-90">
          You have the right to choose which NHS trust you are referred to for your first outpatient
          appointment. Your GP can re-refer you to a trust with a shorter waiting time.
        </p>
      </div>

      {/* PALS */}
      <div className="text-sm mb-4">
        <p className="font-bold">Need help?</p>
        <p className="opacity-90">
          Contact PALS:{" "}
          <a href="tel:08009530667" className="font-bold underline">
            0800 953 0667
          </a>
        </p>
      </div>

      <div className="bg-white/20 rounded-2xl p-3 text-xs opacity-80">
        Wait times are indicative based on monthly NHS data. Clinical suitability should always be
        discussed with your GP. Staying with your current trust is always a valid choice.
      </div>
    </div>
  );
}
