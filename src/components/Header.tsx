interface HeaderProps {
  demoMode: boolean;
  onNavigateSection: (section: "registrar" | "historial" | "conexion") => void;
}

export function Header({ demoMode, onNavigateSection }: HeaderProps) {
  return (
    <header className="bg-white border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 lg:h-16 flex items-center justify-between gap-8">
        <a
          href="#registrar"
          onClick={(e) => {
            e.preventDefault();
            onNavigateSection("registrar");
          }}
          className="font-display text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#0B0D10] whitespace-nowrap shrink-0"
        >
          RunTracker Sheets
        </a>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-600" aria-label="Navegación principal">
          <a
            href="#registrar"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection("registrar");
            }}
            className="hover:text-[#0B0D10] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Registrar
          </a>
          <a
            href="#historial"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection("historial");
            }}
            className="hover:text-[#0B0D10] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Historial
          </a>
          <a
            href="#conexion"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection("conexion");
            }}
            className="hover:text-[#0B0D10] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Conexión Sheets
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigateSection("conexion")}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0B0D10] text-white text-xs sm:text-sm font-semibold hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0D10]"
          >
            {demoMode ? "Modo Demo activo" : "Sheets conectado"}
          </button>
        </div>
      </div>
    </header>
  );
}
