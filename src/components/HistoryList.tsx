import { useState } from "react";
import { Activity, Footprints, Mountain, Send, Trash2 } from "lucide-react";
import type { WorkoutEntry, WorkoutFilter, WorkoutType } from "../types/workout";
import { calculatePace, formatShortDateES } from "../utils/pace";

interface HistoryListProps {
  workouts: WorkoutEntry[];
  filter: WorkoutFilter;
  demoMode: boolean;
  onFilterChange: (filter: WorkoutFilter) => void;
  onDeleteWorkout: (id: string) => void;
  onClearAll: () => void;
  onLoadDemoSamples: () => void;
  onResendToSheets: (entry: WorkoutEntry) => Promise<void>;
}

const FILTERS: WorkoutFilter[] = ["Todos", "Correr", "Caminata", "Trail"];

function getWorkoutIcon(tipo: WorkoutType) {
  switch (tipo) {
    case "Trail":
      return Mountain;
    case "Caminata":
      return Footprints;
    default:
      return Activity;
  }
}

export function HistoryList({
  workouts,
  filter,
  demoMode,
  onFilterChange,
  onDeleteWorkout,
  onClearAll,
  onLoadDemoSamples,
  onResendToSheets,
}: HistoryListProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const filteredWorkouts =
    filter === "Todos" ? workouts : workouts.filter((w) => w.tipo === filter);

  const totalKm = filteredWorkouts.reduce((acc, item) => acc + item.distancia_km, 0);
  const totalMin = filteredWorkouts.reduce((acc, item) => acc + item.duracion_min, 0);
  const avgPace = calculatePace(totalKm, totalMin);

  async function handleResend(entry: WorkoutEntry) {
    setResendingId(entry.id);
    setResendNotice(null);
    try {
      await onResendToSheets(entry);
      setResendNotice(`Envío disparado hacia Google Sheets para ${entry.tipo} (${formatShortDateES(entry.fecha)}).`);
    } finally {
      setResendingId(null);
    }
  }

  return (
    <section id="historial" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B0D10] leading-none">
            Historial de sesiones
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            Guardado localmente en este dispositivo y sincronizable con Sheets.
          </p>
        </div>

        {workouts.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmClear ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                  Confirmar borrado
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-zinc-200 text-zinc-800 text-xs font-semibold hover:bg-zinc-300 transition-colors whitespace-nowrap"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                Vaciar historial
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white border border-zinc-200 p-4">
        <div>
          <div className="text-xs text-zinc-500">Sesiones</div>
          <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[#0B0D10] mt-0.5">
            {filteredWorkouts.length}
          </div>
        </div>
        <div className="border-l border-zinc-100 pl-3">
          <div className="text-xs text-zinc-500">Distancia total</div>
          <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[#0B0D10] mt-0.5">
            {totalKm.toFixed(1)} <span className="text-sm font-sans font-semibold text-zinc-500">km</span>
          </div>
        </div>
        <div className="border-l border-zinc-100 pl-3">
          <div className="text-xs text-zinc-500">Ritmo medio</div>
          <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[#0B0D10] mt-0.5">
            {avgPace.formatted} <span className="text-sm font-sans font-semibold text-zinc-500">min/km</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-zinc-200/70"
        role="tablist"
        aria-label="Filtrar entrenamientos por tipo"
      >
        {FILTERS.map((item) => {
          const active = filter === item;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onFilterChange(item)}
              className={`min-h-[40px] px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0D10] ${
                active
                  ? "bg-white text-[#0B0D10] shadow-xs"
                  : "text-zinc-600 hover:text-[#0B0D10]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {resendNotice && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs sm:text-sm font-medium text-emerald-950" role="status">
          {resendNotice}
        </div>
      )}

      {/* List */}
      {filteredWorkouts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-zinc-200 p-8 text-center space-y-3">
          <p className="font-semibold text-[#0B0D10]">
            {workouts.length === 0
              ? "Todavía no hay entrenamientos registrados"
              : `No hay sesiones de ${filter} en tu historial`}
          </p>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            {workouts.length === 0
              ? "Completa el formulario para registrar tu primera sesión o carga ejemplos locales para probar."
              : "Cambia el filtro superior o registra una nueva sesión de este tipo."}
          </p>
          {workouts.length === 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onLoadDemoSamples}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-sm font-semibold text-[#0B0D10] transition-colors"
              >
                Cargar 3 sesiones de prueba
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
          {filteredWorkouts.map((entry) => {
            const Icon = getWorkoutIcon(entry.tipo);
            return (
              <article key={entry.id} className="p-4 sm:p-5 space-y-2.5 hover:bg-zinc-50/70 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#0B0D10] text-[#CCFF00] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <h3 className="text-base font-bold text-[#0B0D10]">{entry.tipo}</h3>
                        <span className="text-zinc-300" aria-hidden="true">·</span>
                        <time dateTime={entry.fecha} className="text-xs sm:text-sm text-zinc-600 tabular-nums">
                          {formatShortDateES(entry.fecha)}
                        </time>
                        <span className="text-zinc-300" aria-hidden="true">·</span>
                        <span
                          className={`text-xs font-medium ${
                            entry.syncStatus === "sheets" ? "text-emerald-700" : "text-zinc-500"
                          }`}
                        >
                          {entry.syncStatus === "sheets" ? "Enviado a Sheets" : "Guardado local"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1">
                        <span className="font-mono text-sm font-semibold text-[#0B0D10] tabular-nums">
                          {entry.distancia_km.toFixed(2)} km
                        </span>
                        <span className="font-mono text-sm text-zinc-600 tabular-nums">
                          {entry.duracion_min} min
                        </span>
                        <span className="font-mono text-sm font-bold text-[#0B0D10] tabular-nums">
                          {entry.ritmo} min/km
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {entry.syncStatus === "demo" && !demoMode && (
                      <button
                        type="button"
                        onClick={() => handleResend(entry)}
                        disabled={resendingId === entry.id}
                        title="Enviar esta sesión a Google Sheets"
                        aria-label={`Enviar sesión de ${entry.tipo} a Google Sheets`}
                        className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl text-xs font-semibold text-[#0B0D10] bg-[#CCFF00]/80 hover:bg-[#CCFF00] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Enviar</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteWorkout(entry.id)}
                      aria-label={`Eliminar sesión de ${entry.tipo} del ${entry.fecha}`}
                      className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {entry.notas && (
                  <p className="text-sm text-zinc-600 pl-[52px] leading-relaxed">
                    {entry.notas}
                  </p>
                )}

                {entry.aiFeedback && (
                  <p className="text-xs sm:text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl p-3 ml-[52px] leading-relaxed">
                    <span className="font-semibold text-[#0B0D10]">IA Coach: </span>
                    {entry.aiFeedback}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
