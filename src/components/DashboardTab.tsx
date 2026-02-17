import { ReactNode } from "react";
import { Plus, ListChecks, Clock, CheckCircle2, BarChart3, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const completedCount = showsWithStatus.filter((s) => s.status === "afgerond").length;
  const totalShows = showsWithStatus.length;
  const progressPercent = totalShows > 0 ? Math.round((completedCount / totalShows) * 100) : 0;

  const byStatus = (status: ShowStatus) => showsWithStatus.filter((s) => s.status === status);

  // Genre counts – dynamisch op basis van werkelijke data
  const genreMap = new Map<string, number>();
  for (const s of showsWithStatus) {
    if (s.genre) {
      genreMap.set(s.genre, (genreMap.get(s.genre) || 0) + 1);
    }
  }
  const genreCounts = Array.from(genreMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const maxGenre = Math.max(...genreCounts.map((g) => g.count), 1);

  const DASHBOARD_SECTIONS = ["progress", "status", "genres"];
  const { orderedIds: sectionOrder, updateOrder: updateSectionOrder } = useSortOrder(
    "dashboard-sections",
    DASHBOARD_SECTIONS
  );

  const sectionRenderers: Record<string, (dragHandle: ReactNode) => ReactNode> = {
    progress: (dragHandle) => (
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-2">
            {dragHandle}
            <span className="text-sm font-medium text-muted-foreground flex-1">Voortgang seizoen</span>
            <span className="text-sm font-semibold text-foreground">{completedCount}/{totalShows}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {completedCount} van {totalShows} voorstellingen afgerond
          </p>
        </CardContent>
      </Card>
    ),

    status: (dragHandle) => (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["todo", "bezig", "afgerond"] as const).map((status, idx) => {
            const items = byStatus(status);
            return (
              <Card key={status}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {idx === 0 && dragHandle}
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${statusBgLight(status)}`}>
                        <StatusIcon status={status} />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{getStatusLabel(status)}</span>
                    </div>
                    <span className="text-xl font-bold text-foreground">{items.length}</span>
                  </div>
                  {items.length > 0 && (
                    <div className="space-y-1.5">
                      {items.map((show) => (
                        <div key={show.id} className="flex items-center gap-2">
                          <div className="h-6 w-6 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                            {show.hero_image_url ? (
                              <img src={show.hero_image_url} alt="" className="h-6 w-6 rounded object-cover" />
                            ) : (
                              <Image className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm text-foreground truncate flex-1">{show.title || "Zonder titel"}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{show.progress}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    ),

    genres: (dragHandle) => (
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            {dragHandle}
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Genres
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {genreCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen genres toegekend</p>
          ) : (
            <div className="space-y-2">
              {genreCounts.map((g) => (
                <div key={g.name} className="flex items-center gap-3">
                  <span className="text-sm w-28 text-foreground truncate">{g.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${(g.count / maxGenre) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground w-5 text-right">{g.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),
  };

  // Filter out old "allshows" from saved order
  const validOrder = sectionOrder.filter((id) => DASHBOARD_SECTIONS.includes(id));
  const sortableSections = validOrder.map((id) => ({ id }));

  return (
    <div className="container py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Seizoen {season}</h2>
          <p className="text-sm text-muted-foreground">{totalShows} voorstellingen</p>
        </div>
        <Button onClick={onNewShow} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nieuwe voorstelling
        </Button>
      </div>

      <SortableList
        items={sortableSections}
        onReorder={(newItems) => updateSectionOrder(newItems.map((i) => i.id))}
        className="space-y-4"
        renderItem={(item, dragHandle) => sectionRenderers[item.id]?.(dragHandle) || null}
      />
    </div>
  );
}
