import { History, PlusCircle, Settings } from "lucide-react";
import type { MobileTab } from "../types/workout";

interface MobileNavProps {
  activeTab: MobileTab;
  historyCount: number;
  onTabChange: (tab: MobileTab) => void;
}

export function MobileNav({ activeTab, historyCount, onTabChange }: MobileNavProps) {
  const tabs: { id: MobileTab; label: string; icon: typeof PlusCircle }[] = [
    { id: "registrar", label: "Registrar", icon: PlusCircle },
    { id: "historial", label: `Historial (${historyCount})`, icon: History },
    { id: "conexion", label: "Conexión", icon: Settings },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-zinc-200"
      aria-label="Navegación móvil"
    >
      <div className="grid grid-cols-3 h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors whitespace-nowrap ${
                active ? "text-[#0B0D10] font-bold" : "text-zinc-500 hover:text-[#0B0D10] font-medium"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`w-5 h-5 ${active ? "text-[#0B0D10]" : "text-zinc-500"}`}
                aria-hidden="true"
              />
              <span className="text-[11px] leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
