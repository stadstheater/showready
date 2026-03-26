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
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-card/90 backdrop-blur-md">
      <div className="container relative flex h-14 items-end">
        {/* Tabs gecentreerd */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
          <div className="flex gap-1 pointer-events-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all duration-200
                  ${tab.disabled
                    ? "cursor-not-allowed text-muted-foreground/40"
                    : activeTab === tab.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-card-foreground"
                  }
                `}
              >
                {tab.disabled && <Lock className="h-3 w-3" />}
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary transition-all duration-300" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Logo links */}
        <img src={logo} alt="Stadstheater Zoetermeer" className="h-6 z-10 self-center opacity-90" />

        <div className="flex-1" />

        {/* Seizoen + Instellingen rechts */}
        <div className="flex items-center gap-0.5 z-10 self-center">
          <Button variant="ghost" size="icon" onClick={onPrevSeason} className="h-7 w-7 rounded-full text-muted-foreground hover:text-card-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[56px] text-center text-xs font-semibold text-card-foreground tabular-nums tracking-wide">{season}</span>
          <Button variant="ghost" size="icon" onClick={onNextSeason} className="h-7 w-7 rounded-full text-muted-foreground hover:text-card-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          <span className="mx-2 h-4 w-px bg-border/50" />

          <button
            onClick={() => onTabChange("instellingen")}
            className={`relative flex items-center gap-1.5 px-3 py-3 text-sm transition-all duration-200 rounded-md
              ${activeTab === "instellingen"
                ? "text-primary"
                : "text-muted-foreground hover:text-card-foreground"
              }
            `}
          >
            <Settings className="h-4 w-4" />
            {activeTab === "instellingen" && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
