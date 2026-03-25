import { Trust, Condition } from "@/lib/types";

interface RightsPanelProps {
  currentTrust: Trust;
  condition: Condition;
}

export default function RightsPanel({ currentTrust, condition }: RightsPanelProps) {
  const waitWeeks = currentTrust.waits[condition];
  const breached28Day = !currentTrust.target_met["28day"];
  const breached62Day = !currentTrust.target_met["62day"];

  return (
    <div className="bg-cp-purple rounded-[32px] p-6">
      <h2 className="text-xl font-extrabold mb-2 leading-tight">
        Your NHS Right<br />to Choose
      </h2>
      <p className="text-sm font-medium mb-4 opacity-90">
        If you have been waiting over 2 weeks for a suspected cancer referral, you have a legal right to request a transfer to a hospital with a shorter list.
      </p>

      {/* Target breach status */}
      <div className="bg-white/30 rounded-2xl p-4 mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
              breached28Day ? "bg-red-500" : "bg-green-600"
            }`}
          >
            {breached28Day ? "!" : "\u2713"}
          </span>
          <span className="text-sm font-medium">
            <strong>28-day faster diagnosis:</strong>{" "}
            {breached28Day ? (
              <span className="text-red-800">Target missed ({waitWeeks} wks)</span>
            ) : (
              <span className="text-green-800">Target met</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
              breached62Day ? "bg-red-500" : "bg-green-600"
            }`}
          >
            {breached62Day ? "!" : "\u2713"}
          </span>
          <span className="text-sm font-medium">
            <strong>62-day treatment target:</strong>{" "}
            {breached62Day ? (
              <span className="text-red-800">Target missed</span>
            ) : (
              <span className="text-green-800">Target met</span>
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

      {/* Safeguard copy — required, do not remove */}
      <div className="bg-white/20 rounded-2xl p-3 text-xs opacity-80">
        Wait times are indicative based on monthly NHS data. Clinical suitability should always be
        discussed with your GP. Staying with your current trust is always a valid choice.
      </div>
    </div>
  );
}
