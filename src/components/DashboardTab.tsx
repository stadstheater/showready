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

  // Genre counts
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
      <Card className="overflow-hidden">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            {dragHandle}
            <span className="text-sm font-medium text-muted-foreground flex-1">Voortgang seizoen</span>
            <Badge variant="secondary" className="text-xs font-bold tabular-nums">
              {completedCount}/{totalShows}
            </Badge>
          </div>
          <div className="h-3 w-full rounded-full bg-accent/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
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
              <Card key={status} className="group/status hover:border-border/80 transition-colors">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      {idx === 0 && dragHandle}
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${statusBgLight(status)} transition-transform group-hover/status:scale-105`}>
                        <StatusIcon status={status} />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{getStatusLabel(status)}</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground tabular-nums">{items.length}</span>
                  </div>
                  {items.length > 0 && (
                    <div className="space-y-1.5">
                      {items.map((show) => (
                        <div key={show.id} className="flex items-center gap-2.5 py-0.5">
                          <div className="h-7 w-7 flex-shrink-0 rounded-md bg-muted/60 flex items-center justify-center overflow-hidden">
                            {show.hero_image_url ? (
                              <img src={show.hero_image_url} alt="" className="h-7 w-7 rounded-md object-cover" />
                            ) : (
                              <Image className="h-3 w-3 text-muted-foreground/60" />
                            )}
                          </div>
                          <p className="text-sm text-foreground truncate flex-1">{show.title || "Zonder titel"}</p>
                          <span className="text-[11px] text-muted-foreground tabular-nums">{show.progress}%</span>
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
        <CardHeader className="pb-3 pt-5">
          <CardTitle className="text-sm flex items-center gap-2.5">
            {dragHandle}
            <BarChart3 className="h-4 w-4 text-primary/70" />
            Genres
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          {genreCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen genres toegekend</p>
          ) : (
            <div className="space-y-2.5">
              {genreCounts.map((g) => (
                <div key={g.name} className="flex items-center gap-3">
                  <span className="text-sm w-28 text-foreground truncate">{g.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-accent/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all duration-500"
                      style={{ width: `${(g.count / maxGenre) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground w-5 text-right tabular-nums">{g.count}</span>
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
    <div className="container py-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-foreground tracking-tight">Seizoen {season}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{totalShows} voorstellingen</p>
        </div>
        <Button onClick={onNewShow} size="sm" className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Nieuwe voorstelling
        </Button>
      </div>

      <SortableList
        items={sortableSections}
        onReorder={(newItems) => updateSectionOrder(newItems.map((i) => i.id))}
        className="space-y-5"
        renderItem={(item, dragHandle) => sectionRenderers[item.id]?.(dragHandle) || null}
      />
    </div>
  );
}
