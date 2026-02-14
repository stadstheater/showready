import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppTabs, type TabId } from "@/components/AppTabs";
import { DashboardTab } from "@/components/DashboardTab";
import { VoorstellingenTab } from "@/components/VoorstellingenTab";
import { BrochureTab } from "@/components/BrochureTab";
import { WebsiteTab } from "@/components/WebsiteTab";
import { getCurrentSeason, getNextSeason, getPrevSeason } from "@/lib/season";
import { useShows } from "@/hooks/useShows";

const Index = () => {
  const [season, setSeason] = useState(getCurrentSeason());
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [openNewShowDialog, setOpenNewShowDialog] = useState(false);

  const { data: shows = [], isLoading } = useShows(season);

  const handleNewShow = () => {
    setActiveTab("voorstellingen");
    setOpenNewShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        season={season}
        onPrevSeason={() => setSeason(getPrevSeason(season))}
        onNextSeason={() => setSeason(getNextSeason(season))}
      />
      <AppTabs activeTab={activeTab} onTabChange={setActiveTab} />

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
          {activeTab === "website" && <WebsiteTab />}
        </>
      )}
    </div>
  );
};

export default Index;
