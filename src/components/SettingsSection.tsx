import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { DEFAULT_APPS_SCRIPT_URL } from "../utils/pace";

interface SettingsSectionProps {
  scriptUrl: string;
  demoMode: boolean;
  onScriptUrlChange: (url: string) => void;
  onDemoModeChange: (enabled: boolean) => void;
}

const APPS_SCRIPT_SNIPPET = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.fecha,
    data.tipo,
    data.distancia_km,
    data.duracion_min,
    data.notas
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export function SettingsSection({
  scriptUrl,
  demoMode,
  onScriptUrlChange,
  onDemoModeChange,
}: SettingsSectionProps) {
  const [showSnippet, setShowSnippet] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  function handleUrlInput(value: string) {
    onScriptUrlChange(value);
    setSavedFeedback(true);
    window.setTimeout(() => setSavedFeedback(false), 1800);
  }

  function handleResetDefault() {
    onScriptUrlChange(DEFAULT_APPS_SCRIPT_URL);
    setSavedFeedback(true);
    window.setTimeout(() => setSavedFeedback(false), 1800);
  }

  return (
    <section id="conexion" className="space-y-4">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B0D10] leading-none">
          Conexión con Google Sheets
        </h2>
        <p className="text-sm text-zinc-600 mt-1">
          Envío directo vía Google Apps Script sin OAuth ni inicio de sesión.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-zinc-200 p-4 sm:p-6 space-y-5">
        {/* Demo Mode Switch */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-[#0B0D10] flex items-center justify-center shrink-0">
              {demoMode ? (
                <WifiOff className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Wifi className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-[#0B0D10]">
                Modo Demo / Local (sin conexión)
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {demoMode
                  ? "Activo: los entrenamientos solo se guardan en localStorage para pruebas."
                  : "Desactivado: cada sesión se envía por POST no-cors a Google Sheets."}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={demoMode}
            onClick={() => onDemoModeChange(!demoMode)}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0D10] ${
              demoMode ? "bg-[#0B0D10]" : "bg-zinc-300"
            }`}
          >
            <span className="sr-only">Activar o desactivar modo demo local</span>
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full transition-transform ${
                demoMode ? "translate-x-6 bg-[#CCFF00]" : "translate-x-0.5 bg-white"
              }`}
            />
          </button>
        </div>

        {/* Apps Script URL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="apps-script-url" className="text-xs font-semibold text-zinc-700">
              URL de Google Apps Script (/exec)
            </label>
            {savedFeedback && (
              <span className="text-xs font-medium text-emerald-700">Guardado en localStorage</span>
            )}
          </div>

          <input
            id="apps-script-url"
            type="url"
            value={scriptUrl}
            onChange={(e) => handleUrlInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm font-mono text-[#0B0D10] focus:bg-white focus:border-[#0B0D10] focus:outline-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-xs text-zinc-500">
              Formato enviado: <code className="font-mono text-zinc-700">{`{ fecha, tipo, distancia_km, duracion_min, notas }`}</code>
            </p>
            {scriptUrl !== DEFAULT_APPS_SCRIPT_URL && (
              <button
                type="button"
                onClick={handleResetDefault}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-[#0B0D10] flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Restaurar URL por defecto</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Apps Script helper */}
        <div className="pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setShowSnippet(!showSnippet)}
            className="w-full min-h-[44px] flex items-center justify-between gap-2 text-xs font-semibold text-zinc-700 hover:text-[#0B0D10] transition-colors"
            aria-expanded={showSnippet}
          >
            <span>Ver ejemplo de función doPost(e) para tu Google Sheet</span>
            {showSnippet ? (
              <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
          </button>

          {showSnippet && (
            <pre className="mt-2 p-3.5 rounded-xl bg-[#0B0D10] text-zinc-200 text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{APPS_SCRIPT_SNIPPET}</code>
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}
