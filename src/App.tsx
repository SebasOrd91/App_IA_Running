import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { HistoryList } from "./components/HistoryList";
import { MobileNav } from "./components/MobileNav";
import { SettingsSection } from "./components/SettingsSection";
import { WorkoutForm } from "./components/WorkoutForm";
import type { MobileTab, WorkoutEntry, WorkoutFilter, WorkoutPayload } from "./types/workout";
import {
  DEFAULT_APPS_SCRIPT_URL,
  STORAGE_KEYS,
  createDemoSampleWorkouts,
  dispatchToGoogleSheets,
} from "./utils/pace";

function readInitialWorkouts(): WorkoutEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WorkoutEntry[]) : [];
  } catch {
    return [];
  }
}

function readInitialScriptUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SCRIPT_URL);
    return saved !== null && saved.trim() !== "" ? saved : DEFAULT_APPS_SCRIPT_URL;
  } catch {
    return DEFAULT_APPS_SCRIPT_URL;
  }
}

function readInitialDemoMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === "true";
  } catch {
    return false;
  }
}

export default function App() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>(readInitialWorkouts);
  const [scriptUrl, setScriptUrl] = useState<string>(readInitialScriptUrl);
  const [demoMode, setDemoMode] = useState<boolean>(readInitialDemoMode);
  const [filter, setFilter] = useState<WorkoutFilter>("Todos");
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("registrar");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [workouts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, scriptUrl);
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [scriptUrl]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, String(demoMode));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [demoMode]);

  async function handleSaveWorkout(
    payload: WorkoutPayload,
    ritmo: string,
    aiFeedback?: string
  ): Promise<{ ok: boolean; entry?: WorkoutEntry; error?: string }> {
    const newEntry: WorkoutEntry = {
      ...payload,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ritmo,
      createdAt: new Date().toISOString(),
      syncStatus: demoMode ? "demo" : "sheets",
      aiFeedback,
    };

    if (!demoMode) {
      try {
        await dispatchToGoogleSheets(scriptUrl, payload);
      } catch {
        return {
          ok: false,
          error:
            "No se pudo disparar la petición a la URL de Apps Script. Verifica la URL o activa el Modo Demo.",
        };
      }
    }

    setWorkouts((prev) => [newEntry, ...prev]);
    return { ok: true, entry: newEntry };
  }

  function handleDeleteWorkout(id: string) {
    setWorkouts((prev) => prev.filter((item) => item.id !== id));
  }

  function handleClearAll() {
    setWorkouts([]);
  }

  function handleLoadDemoSamples() {
    setWorkouts(createDemoSampleWorkouts());
    setFilter("Todos");
  }

  async function handleResendToSheets(entry: WorkoutEntry) {
    await dispatchToGoogleSheets(scriptUrl, {
      fecha: entry.fecha,
      tipo: entry.tipo,
      distancia_km: entry.distancia_km,
      duracion_min: entry.duracion_min,
      notas: entry.notas,
    });
    setWorkouts((prev) =>
      prev.map((item) => (item.id === entry.id ? { ...item, syncStatus: "sheets" } : item))
    );
  }

  function handleNavigateSection(section: MobileTab) {
    setActiveMobileTab(section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#0B0D10] pb-20 lg:pb-12">
      <Header demoMode={demoMode} onNavigateSection={handleNavigateSection} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column (Mobile: shown on 'registrar' tab; Desktop: always visible) */}
          <div
            className={`lg:col-span-5 space-y-6 ${
              activeMobileTab === "registrar" ? "block" : "hidden lg:block"
            }`}
          >
            <WorkoutForm
              demoMode={demoMode}
              scriptUrl={scriptUrl}
              onSaveWorkout={handleSaveWorkout}
            />
          </div>

          {/* Right Column (Mobile: shown based on 'historial' / 'conexion' tab; Desktop: always visible) */}
          <div className="lg:col-span-7 space-y-8">
            <div className={activeMobileTab === "historial" ? "block" : "hidden lg:block"}>
              <HistoryList
                workouts={workouts}
                filter={filter}
                demoMode={demoMode}
                onFilterChange={setFilter}
                onDeleteWorkout={handleDeleteWorkout}
                onClearAll={handleClearAll}
                onLoadDemoSamples={handleLoadDemoSamples}
                onResendToSheets={handleResendToSheets}
              />
            </div>

            <div className={activeMobileTab === "conexion" ? "block" : "hidden lg:block"}>
              <SettingsSection
                scriptUrl={scriptUrl}
                demoMode={demoMode}
                onScriptUrlChange={setScriptUrl}
                onDemoModeChange={setDemoMode}
              />
            </div>
          </div>
        </div>
      </main>

      <MobileNav
        activeTab={activeMobileTab}
        historyCount={workouts.length}
        onTabChange={handleNavigateSection}
      />
    </div>
  );
}
