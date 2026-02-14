import { Lock } from "lucide-react";

export type TabId = "dashboard" | "voorstellingen" | "brochure" | "website";

interface AppTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; disabled?: boolean }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "voorstellingen", label: "Voorstellingen" },
  { id: "brochure", label: "Brochure", disabled: true },
  { id: "website", label: "Website" },
];

export function AppTabs({ activeTab, onTabChange }: AppTabsProps) {
  return (
    <nav className="border-b border-border bg-card">
      <div className="container flex gap-0">
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
    </nav>
  );
}
