import { useState } from "react";

import { isFreeMealLocked, markFreeMealUsed } from "@/utils/freeMealEngine";

interface FreeMealCardProps {
  message: string;
}

export default function FreeMealCard({ message }: FreeMealCardProps) {
  const [locked, setLocked] = useState(() => isFreeMealLocked());

  function handleClick() {
    const confirmed = window.confirm(
      "در صورت تایید شما تا هفته آینده وعده آزاد نخواهید داشت",
    );

    if (!confirmed) return;

    markFreeMealUsed();
    setLocked(true);
  }

  return (
    <div className="rounded-2xl border border-amber-700/40 bg-amber-500/10 p-5 text-center">
      {locked ? (
        <p className="text-lg font-semibold text-amber-400">
          شما در این هفته وعده آزاد ندارید
        </p>
      ) : (
        <>
          <h2 className="mb-3 text-xl font-semibold text-amber-400">
            🍕 وعده آزاد
          </h2>

          <p className="text-zinc-200">{message}</p>

          <button
            onClick={handleClick}
            className="mt-4 rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-black"
          >
            وعده آزادم رو امروز خوردم
          </button>
        </>
      )}
    </div>
  );
}
