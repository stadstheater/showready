import { ReactNode } from "react";
import { Plus, ListChecks, Clock, CheckCircle2, BarChart3, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SortableList } from "@/components/SortableList";
import { useSortOrder } from "@/hooks/useSortOrder";
import type { ShowWithImages } from "@/lib/showStatus";
import {
  getChecklist,
  getProgressPercent,
  getStatus,
  getStatusLabel,
  getCompletedCount,
  statusColor,
  statusTextColor,
  statusBgLight,
  type ShowStatus,
} from "@/lib/showStatus";

interface DashboardTabProps {
  season: string;
  shows: ShowWithImages[];
  onNewShow: () => void;
}

function StatusIcon({ status }: { status: ShowStatus }) {
  const cls = `h-5 w-5 ${statusTextColor(status)}`;
  switch (status) {
    case "todo": return <Clock className={cls} />;
    case "bezig": return <ListChecks className={cls} />;
    case "afgerond": return <CheckCircle2 className={cls} />;
  }
}

export function DashboardTab({ season, shows, onNewShow }: DashboardTabProps) {
  const showsWithStatus = shows.map((s) => {
    const checklist = getChecklist(s);
    return {
      ...s,
      checklist,
      progress: getProgressPercent(checklist),
      completed: getCompletedCount(checklist),
      status: getStatus(checklist),
    };
  });

  const totalProgress =
    showsWithStatus.length > 0
      ? Math.round(showsWithStatus.reduce((sum, s) => sum + s.progress, 0) / showsWithStatus.length)
      : 0;

  const completedCount = showsWithStatus.filter((s) => s.status === "afgerond").length;

  const byStatus = (status: ShowStatus) => showsWithStatus.filter((s) => s.status === status);

  // Genre counts
  const genres = ["Cabaret", "Muziek", "Theater", "Musical", "Jeugd", "Dans", "Overig"] as const;
  const genreCounts = genres
    .map((g) => ({ name: g, count: showsWithStatus.filter((s) => s.genre === g).length }))
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxGenre = Math.max(...genreCounts.map((g) => g.count), 1);

  const DASHBOARD_SECTIONS = ["progress", "status", "genres", "allshows"];
  const { orderedIds: sectionOrder, updateOrder: updateSectionOrder } = useSortOrder(
    "dashboard-sections",
    DASHBOARD_SECTIONS
  );

  const sectionRenderers: Record<string, (dragHandle: ReactNode) => ReactNode> = {
    progress: (dragHandle) => (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            {dragHandle}
            <span className="text-sm font-medium text-muted-foreground flex-1">Totale voortgang seizoen</span>
            <span className="text-sm font-semibold text-foreground">{totalProgress}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {completedCount} van {shows.length} afgerond &middot; {totalProgress}% klaar
          </p>
        </CardContent>
      </Card>
    ),

    status: (dragHandle) => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["todo", "bezig", "afgerond"] as const).map((status, idx) => {
          const items = byStatus(status);
          return (
            <Card key={status}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {idx === 0 && dragHandle}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${statusBgLight(status)}`}>
                      <StatusIcon status={status} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{getStatusLabel(status)}</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{items.length}</span>
                </div>
                {items.length > 0 && (
                  <div className="space-y-2">
                    {items.slice(0, 4).map((show) => (
                      <div key={show.id} className="flex items-center gap-3">
                        <div className="h-8 w-8 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                          {show.hero_image_url ? (
                            <img src={show.hero_image_url} alt="" className="h-8 w-8 rounded object-cover" />
                          ) : (
                            <Image className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{show.title || "Zonder titel"}</p>
                          <div className="h-1.5 w-full rounded-full bg-muted mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${statusColor(status)} transition-all`}
                              style={{ width: `${show.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {items.length > 4 && (
                      <p className="text-xs text-muted-foreground">+{items.length - 4} meer</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    ),

    genres: (dragHandle) => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {dragHandle}
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Genres
          </CardTitle>
        </CardHeader>
        <CardContent>
          {genreCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen voorstellingen</p>
          ) : (
            <div className="space-y-3">
              {genreCounts.map((g) => (
                <div key={g.name} className="flex items-center gap-3">
                  <span className="text-sm w-20 text-foreground">{g.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${(g.count / maxGenre) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground w-6 text-right">{g.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),

    allshows: (dragHandle) => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {dragHandle}
            Alle voorstellingen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showsWithStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen voorstellingen toegevoegd</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {showsWithStatus.map((show) => (
                <div key={show.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                    {show.hero_image_url ? (
                      <img src={show.hero_image_url} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <Image className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{show.title || "Zonder titel"}</p>
                    <p className="text-xs text-muted-foreground">
                      {show.dates && show.dates.length > 0 ? show.dates[0] : "Geen datum"}
                    </p>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${statusColor(show.status)} transition-all`}
                        style={{ width: `${show.progress}%` }}
                      />
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${statusTextColor(show.status)} ${statusBgLight(show.status)} border-0`}
                  >
                    {getStatusLabel(show.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),
  };

  const sortableSections = sectionOrder.map((id) => ({ id }));

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Seizoen {season}</h2>
          <p className="text-muted-foreground">{shows.length} voorstellingen</p>
        </div>
        <Button onClick={onNewShow} className="gap-2">
          <Plus className="h-4 w-4" />
          Nieuwe voorstelling
        </Button>
      </div>

      <SortableList
        items={sortableSections}
        onReorder={(newItems) => updateSectionOrder(newItems.map((i) => i.id))}
        className="space-y-6"
        renderItem={(item, dragHandle) => sectionRenderers[item.id]?.(dragHandle) || null}
      />
    </div>
  );
}
