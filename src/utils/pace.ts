import type { WorkoutEntry, WorkoutPayload } from "../types/workout";

export const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwccanQJadN9cX8KNaX-HOnMIJs-Ta1J5tu0D56PiE56B0nxUzTtzG897MT_Sx6H5K_Jw/exec";

export const STORAGE_KEYS = {
  WORKOUTS: "runtracker_sheets_workouts_v1",
  SCRIPT_URL: "runtracker_sheets_script_url_v1",
  DEMO_MODE: "runtracker_sheets_demo_mode_v1",
} as const;

export function getTodayLocalISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface PaceCalculation {
  formatted: string;
  minutesPerKm: number | null;
  speedKmh: number | null;
  effortLabel: string | null;
}

export function calculatePace(distanciaKm: number, duracionMin: number): PaceCalculation {
  if (!Number.isFinite(distanciaKm) || !Number.isFinite(duracionMin) || distanciaKm <= 0 || duracionMin <= 0) {
    return {
      formatted: "--:--",
      minutesPerKm: null,
      speedKmh: null,
      effortLabel: null,
    };
  }

  const totalSeconds = Math.round((duracionMin * 60) / distanciaKm);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const minutesPerKm = duracionMin / distanciaKm;
  const speedKmh = distanciaKm / (duracionMin / 60);

  let effortLabel = "Ritmo constante";
  if (minutesPerKm < 4.25) {
    effortLabel = "Ritmo umbral / rápido";
  } else if (minutesPerKm < 5.5) {
    effortLabel = "Ritmo aeróbico medio";
  } else if (minutesPerKm < 7.5) {
    effortLabel = "Trote suave / recuperación";
  } else {
    effortLabel = "Paso constante / caminata";
  }

  return {
    formatted,
    minutesPerKm,
    speedKmh,
    effortLabel,
  };
}

export function formatShortDateES(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function dispatchToGoogleSheets(scriptUrl: string, payload: WorkoutPayload): Promise<void> {
  const exactPayload: WorkoutPayload = {
    fecha: payload.fecha,
    tipo: payload.tipo,
    distancia_km: Number(payload.distancia_km),
    duracion_min: Number(payload.duracion_min),
    notas: payload.notas,
  };

  await fetch(scriptUrl.trim(), {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(exactPayload),
  });
}

export function createDemoSampleWorkouts(): WorkoutEntry[] {
  const today = new Date();
  const offsetISO = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return [
    {
      id: "demo-1",
      fecha: offsetISO(1),
      tipo: "Correr",
      distancia_km: 8.4,
      duracion_min: 42,
      ritmo: "05:00",
      notas: "Rodaje progresivo en asfalto, últimas vueltas controladas.",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      syncStatus: "demo",
    },
    {
      id: "demo-2",
      fecha: offsetISO(3),
      tipo: "Trail",
      distancia_km: 11.2,
      duracion_min: 74,
      ritmo: "06:36",
      notas: "Sendero técnico con desnivel positivo +320m.",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      syncStatus: "demo",
    },
    {
      id: "demo-3",
      fecha: offsetISO(5),
      tipo: "Caminata",
      distancia_km: 5.5,
      duracion_min: 55,
      ritmo: "10:00",
      notas: "Caminata de descarga activa por la mañana.",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      syncStatus: "demo",
    },
  ];
}
