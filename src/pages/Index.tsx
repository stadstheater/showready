import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppTabs, type TabId } from "@/components/AppTabs";
import { DashboardTab } from "@/components/DashboardTab";
import { VoorstellingenTab } from "@/components/VoorstellingenTab";
import { BrochureTab } from "@/components/BrochureTab";
import { WebsiteTab } from "@/components/WebsiteTab";
import { SettingsTab } from "@/components/SettingsTab";
import { getCurrentSeason, getNextSeason, getPrevSeason } from "@/lib/season";
import { useShows } from "@/hooks/useShows";
import { useSettings } from "@/hooks/useSettings";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

const TAB_LABELS: Record<TabId, string> = {
  dashboard: "Dashboard",
  voorstellingen: "Voorstellingen",
  brochure: "Brochure",
  website: "Website",
  instellingen: "Instellingen",
};

const Index = () => {
  const { data: settings } = useSettings();
  const defaultSeason = settings?.default_season;
  const initialSeason = defaultSeason && defaultSeason !== "auto" ? defaultSeason : getCurrentSeason();

  const [season, setSeason] = useState(initialSeason);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [openNewShowDialog, setOpenNewShowDialog] = useState(false);
  const [selectedShowName, setSelectedShowName] = useState<string | null>(null);

  const { data: shows = [], isLoading } = useShows(season);

  // Update season when settings load and differ from current
  const [settingsApplied, setSettingsApplied] = useState(false);
  useEffect(() => {
    if (!settingsApplied && defaultSeason && defaultSeason !== "auto") {
      setSeason(defaultSeason);
      setSettingsApplied(true);
    }
  }, [settingsApplied, defaultSeason]);

  // Clear selected show name when leaving website tab
  useEffect(() => {
    if (activeTab !== "website") setSelectedShowName(null);
  }, [activeTab]);

  const handleNewShow = () => {
    setActiveTab("voorstellingen");
    setOpenNewShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <AppTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        season={season}
        onPrevSeason={() => setSeason(getPrevSeason(season))}
        onNextSeason={() => setSeason(getNextSeason(season))}
      />

      {/* Breadcrumb */}
      <div className="container py-3 flex justify-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer flex items-center gap-1"
                onClick={() => setActiveTab("dashboard")}
              >
                <Home className="h-3.5 w-3.5" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            {activeTab !== "dashboard" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {selectedShowName ? (
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => setActiveTab(activeTab)}
                    >
                      {TAB_LABELS[activeTab]}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{TAB_LABELS[activeTab]}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}
            {selectedShowName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{selectedShowName}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {activeTab === "dashboard" && (
            <DashboardTab season={season} shows={shows} onNewShow={handleNewShow} />
          )}
          {activeTab === "voorstellingen" && (
            <VoorstellingenTab
              season={season}
              shows={shows}
              openNewDialog={openNewShowDialog}
              onNewDialogClose={() => setOpenNewShowDialog(false)}
            />
          )}
          {activeTab === "brochure" && <BrochureTab />}
          {activeTab === "website" && (
            <WebsiteTab season={season} shows={shows} onSelectedShowChange={setSelectedShowName} />
          )}
          {activeTab === "instellingen" && (
            <SettingsTab season={season} showCount={shows.length} />
          )}
        </>
      )}
    </div>
  );
};

export default Index;
