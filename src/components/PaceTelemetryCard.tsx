import type { WorkoutType } from "../types/workout";
import type { PaceCalculation } from "../utils/pace";

interface PaceTelemetryCardProps {
  tipo: WorkoutType;
  distanciaKm: number;
  duracionMin: number;
  pace: PaceCalculation;
}

export function PaceTelemetryCard({ tipo, distanciaKm, duracionMin, pace }: PaceTelemetryCardProps) {
  const hasValidPace = pace.minutesPerKm !== null && pace.speedKmh !== null;

  return (
    <div
      className="rounded-2xl bg-[#0B0D10] text-white p-5 sm:p-6 shadow-sm"
      aria-live="polite"
      aria-label="Ritmo calculado en tiempo real"
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 mb-4">
        <span className="text-xs font-medium tracking-wide text-zinc-400">
          Ritmo en tiempo real · {tipo}
        </span>
        {pace.effortLabel && (
          <span className="text-xs font-medium text-[#CCFF00] whitespace-nowrap">
            {pace.effortLabel}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight tabular-nums text-[#CCFF00]">
            {pace.formatted}
          </span>
          <span className="text-sm sm:text-base font-semibold text-zinc-300 tracking-wide">
            min/km
          </span>
        </div>

        <div className="flex items-center gap-5 text-right">
          <div>
            <div className="text-[11px] text-zinc-400">Distancia</div>
            <div className="font-mono text-sm sm:text-base font-semibold tabular-nums text-white">
              {Number.isFinite(distanciaKm) && distanciaKm > 0 ? `${distanciaKm.toFixed(2)} km` : "0.00 km"}
            </div>
          </div>
          <div className="h-7 w-px bg-white/10" aria-hidden="true" />
          <div>
            <div className="text-[11px] text-zinc-400">Velocidad</div>
            <div className="font-mono text-sm sm:text-base font-semibold tabular-nums text-white">
              {hasValidPace && pace.speedKmh ? `${pace.speedKmh.toFixed(1)} km/h` : "-- km/h"}
            </div>
          </div>
          <div className="hidden sm:block h-7 w-px bg-white/10" aria-hidden="true" />
          <div className="hidden sm:block">
            <div className="text-[11px] text-zinc-400">Duración</div>
            <div className="font-mono text-sm sm:text-base font-semibold tabular-nums text-white">
              {Number.isFinite(duracionMin) && duracionMin > 0 ? `${duracionMin} min` : "0 min"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
