import { ChevronLeft, ChevronRight, Lock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-stadstheater-wit.png";

export type TabId = "dashboard" | "voorstellingen" | "brochure" | "website" | "instellingen";

interface AppTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  season: string;
  onPrevSeason: () => void;
  onNextSeason: () => void;
}

const tabs: { id: TabId; label: string; disabled?: boolean }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "voorstellingen", label: "Voorstellingen" },
  { id: "brochure", label: "Brochure", disabled: true },
  { id: "website", label: "Website" },
];

export function AppTabs({ activeTab, onTabChange, season, onPrevSeason, onNextSeason }: AppTabsProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container relative flex h-20 items-end">
        {/* Tabs gecentreerd */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
          <div className="flex pointer-events-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                className={`relative flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors
                  ${tab.disabled
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : activeTab === tab.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-card-foreground"
                  }
                `}
              >
                {tab.disabled && <Lock className="h-3.5 w-3.5" />}
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Logo links, verticaal gecentreerd */}
        <img src={logo} alt="Stadstheater Zoetermeer" className="h-7 z-10 self-center" />

        <div className="flex-1" />

        {/* Seizoen + Instellingen rechts */}
        <div className="flex items-center gap-1 z-10">
          <Button variant="ghost" size="icon" onClick={onPrevSeason} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[60px] text-center text-sm font-semibold text-card-foreground">{season}</span>
          <Button variant="ghost" size="icon" onClick={onNextSeason} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="mx-1 h-5 w-px bg-border" />

          <button
            onClick={() => onTabChange("instellingen")}
            className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors
              ${activeTab === "instellingen"
                ? "text-primary"
                : "text-muted-foreground hover:text-card-foreground"
              }
            `}
          >
            <Settings className="h-4 w-4" />
            {activeTab === "instellingen" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
