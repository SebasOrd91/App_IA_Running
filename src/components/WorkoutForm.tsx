import { useState, type FormEvent } from "react";
import { Activity, AlertCircle, CheckCircle2, Footprints, Loader2, Mountain, Send, Sparkles } from "lucide-react";
import type { WorkoutEntry, WorkoutPayload, WorkoutType } from "../types/workout";
import { calculatePace, getTodayLocalISO } from "../utils/pace";
import { PaceTelemetryCard } from "./PaceTelemetryCard";

interface WorkoutFormProps {
  demoMode: boolean;
  scriptUrl: string;
  onSaveWorkout: (payload: WorkoutPayload, ritmo: string, aiFeedback?: string) => Promise<{ ok: boolean; entry?: WorkoutEntry; error?: string }>;
}

const WORKOUT_TYPES: { value: WorkoutType; label: string; icon: typeof Activity }[] = [
  { value: "Correr", label: "Correr", icon: Activity },
  { value: "Caminata", label: "Caminata", icon: Footprints },
  { value: "Trail", label: "Trail", icon: Mountain },
];

export function WorkoutForm({ demoMode, scriptUrl, onSaveWorkout }: WorkoutFormProps) {
  const [fecha, setFecha] = useState<string>(() => getTodayLocalISO());
  const [tipo, setTipo] = useState<WorkoutType>("Correr");
  const [distanciaInput, setDistanciaInput] = useState<string>("5.00");
  const [duracionInput, setDuracionInput] = useState<string>("26");
  const [notas, setNotas] = useState<string>("");

  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    kind: "sheets" | "demo";
    text: string;
    detail: string;
  } | null>(null);

  const distanciaNum = parseFloat(distanciaInput.replace(",", "."));
  const duracionNum = parseFloat(duracionInput.replace(",", "."));
  const pace = calculatePace(distanciaNum, duracionNum);

  async function handleAnalyzeWithAI() {
    setAiError(null);
    setFormError(null);

    if (!Number.isFinite(distanciaNum) || distanciaNum <= 0 || !Number.isFinite(duracionNum) || duracionNum <= 0) {
      setAiError("Ingresa una distancia y duración mayores a 0 para analizar tu ritmo con Gemini.");
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          tipo,
          distancia_km: distanciaNum,
          duracion_min: duracionNum,
          ritmo: pace.formatted,
          notas: notas.trim(),
        }),
      });

      const data = (await response.json()) as { feedback?: string; error?: string };
      if (!response.ok || !data.feedback) {
        setAiError(data.error || "No se pudo obtener el análisis de entrenamiento.");
        return;
      }

      setAiFeedback(data.feedback);
    } catch {
      setAiError("Error de conexión al contactar el servicio de análisis con IA.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setStatusMessage(null);

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      setFormError("Selecciona una fecha válida en formato YYYY-MM-DD.");
      return;
    }

    if (!Number.isFinite(distanciaNum) || distanciaNum <= 0) {
      setFormError("La distancia en km debe ser un número mayor a 0.");
      return;
    }

    if (!Number.isFinite(duracionNum) || duracionNum <= 0) {
      setFormError("La duración en minutos debe ser un número mayor a 0.");
      return;
    }

    if (!demoMode && !scriptUrl.trim()) {
      setFormError("Configura la URL de Google Apps Script (/exec) o activa el Modo Demo.");
      return;
    }

    const payload: WorkoutPayload = {
      fecha,
      tipo,
      distancia_km: Number(distanciaNum.toFixed(2)),
      duracion_min: Number(duracionNum.toFixed(1)),
      notas: notas.trim(),
    };

    setSubmitting(true);
    try {
      const result = await onSaveWorkout(payload, pace.formatted, aiFeedback ?? undefined);
      if (!result.ok) {
        setFormError(result.error || "No se pudo registrar el entrenamiento.");
        return;
      }

      if (demoMode) {
        setStatusMessage({
          kind: "demo",
          text: "Guardado en el historial local (Modo Demo sin conexión).",
          detail: `${payload.tipo} · ${payload.fecha} · ${payload.distancia_km} km en ${payload.duracion_min} min (${pace.formatted} min/km)`,
        });
      } else {
        setStatusMessage({
          kind: "sheets",
          text: "Envío disparado hacia Google Sheets y guardado en tu historial local.",
          detail: `POST no-cors enviado · ${payload.tipo} · ${payload.distancia_km} km · ${payload.duracion_min} min (${pace.formatted} min/km)`,
        });
      }

      setNotas("");
      setAiFeedback(null);
      setAiError(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="registrar" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B0D10] leading-none">
            Registrar sesión
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Calcula tu ritmo al instante y envía directo a tu hoja de cálculo.
          </p>
        </div>
      </div>

      <PaceTelemetryCard
        tipo={tipo}
        distanciaKm={distanciaNum}
        duracionMin={duracionNum}
        pace={pace}
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white border border-zinc-200 p-4 sm:p-6 space-y-5"
        noValidate
      >
        <div>
          <span className="block text-xs font-semibold text-zinc-700 mb-2">
            Tipo de actividad
          </span>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tipo de entrenamiento">
            {WORKOUT_TYPES.map((item) => {
              const Icon = item.icon;
              const active = tipo === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTipo(item.value)}
                  className={`min-h-[46px] px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0D10] ${
                    active
                      ? "bg-[#0B0D10] text-[#CCFF00]"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                  aria-pressed={active}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="workout-fecha" className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Fecha
            </label>
            <input
              id="workout-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium text-[#0B0D10] tabular-nums focus:bg-white focus:border-[#0B0D10] focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="workout-distancia" className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Distancia (km)
            </label>
            <div className="relative">
              <input
                id="workout-distancia"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="5.00"
                value={distanciaInput}
                onChange={(e) => setDistanciaInput(e.target.value)}
                className="w-full min-h-[46px] pl-3.5 pr-11 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-base font-mono font-semibold text-[#0B0D10] tabular-nums focus:bg-white focus:border-[#0B0D10] focus:outline-none"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 pointer-events-none">
                km
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="workout-duracion" className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Duración (min)
            </label>
            <div className="relative">
              <input
                id="workout-duracion"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0.1"
                placeholder="26"
                value={duracionInput}
                onChange={(e) => setDuracionInput(e.target.value)}
                className="w-full min-h-[46px] pl-3.5 pr-12 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-base font-mono font-semibold text-[#0B0D10] tabular-nums focus:bg-white focus:border-[#0B0D10] focus:outline-none"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 pointer-events-none">
                min
              </span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="workout-notas" className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Notas de la sesión
          </label>
          <textarea
            id="workout-notas"
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Sensaciones, terreno, clima o pulsaciones..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-[#0B0D10] placeholder:text-zinc-400 focus:bg-white focus:border-[#0B0D10] focus:outline-none resize-none"
          />
        </div>

        {aiFeedback && (
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#0B0D10] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-700" aria-hidden="true" />
                Comentario de entrenador IA
              </span>
              <button
                type="button"
                onClick={() => setAiFeedback(null)}
                className="text-xs font-medium text-zinc-500 hover:text-[#0B0D10] px-2 py-1"
              >
                Ocultar
              </button>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed">{aiFeedback}</p>
          </div>
        )}

        {aiError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-sm text-red-800" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
            <span>{aiError}</span>
          </div>
        )}

        {formError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-sm text-red-800" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {statusMessage && (
          <div
            className={`rounded-xl border p-3.5 flex items-start gap-2.5 text-sm ${
              statusMessage.kind === "sheets"
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-zinc-100 border-zinc-300 text-[#0B0D10]"
            }`}
            role="status"
          >
            <CheckCircle2
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                statusMessage.kind === "sheets" ? "text-emerald-700" : "text-zinc-700"
              }`}
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <p className="font-semibold">{statusMessage.text}</p>
              <p className="text-xs opacity-80">{statusMessage.detail}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={handleAnalyzeWithAI}
            disabled={aiLoading || submitting}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-[#14171C] text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0D10]"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#CCFF00]" aria-hidden="true" />
                <span>Analizar con IA</span>
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-[#CCFF00] text-[#0B0D10] text-sm font-bold hover:bg-[#bee800] active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0D10]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{demoMode ? "Guardar en Modo Demo" : "Guardar y Enviar a Sheets"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
