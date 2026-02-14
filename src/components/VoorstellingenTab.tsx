import { useState } from "react";
import { Plus, Trash2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ShowWithImages } from "@/lib/showStatus";
import {
  getChecklist,
  getProgressPercent,
  getStatus,
  getStatusLabel,
  type ShowStatus,
} from "@/lib/showStatus";
import { useCreateShow, useDeleteShow } from "@/hooks/useShows";
import { toast } from "sonner";

interface VoorstellingenTabProps {
  season: string;
  shows: ShowWithImages[];
  openNewDialog?: boolean;
  onNewDialogClose?: () => void;
}

function statusColor(status: ShowStatus) {
  switch (status) {
    case "todo": return "bg-status-todo";
    case "bezig": return "bg-status-busy";
    case "afgerond": return "bg-status-done";
  }
}

function statusTextColor(status: ShowStatus) {
  switch (status) {
    case "todo": return "text-status-todo";
    case "bezig": return "text-status-busy";
    case "afgerond": return "text-status-done";
  }
}

function statusBgLight(status: ShowStatus) {
  switch (status) {
    case "todo": return "bg-status-todo/10";
    case "bezig": return "bg-status-busy/10";
    case "afgerond": return "bg-status-done/10";
  }
}

const GENRES = ["Cabaret", "Muziek", "Theater", "Musical", "Jeugd", "Dans", "Overig"] as const;

export function VoorstellingenTab({ season, shows, openNewDialog, onNewDialogClose }: VoorstellingenTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState<string>("");
  const createShow = useCreateShow(season);
  const deleteShow = useDeleteShow();

  const isOpen = openNewDialog || dialogOpen;

  const handleClose = () => {
    setDialogOpen(false);
    onNewDialogClose?.();
    setTitle("");
    setGenre("");
  };

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("Vul een titel in");
      return;
    }
    createShow.mutate(
      { title: title.trim(), genre: genre || undefined },
      {
        onSuccess: () => {
          toast.success("Voorstelling aangemaakt");
          handleClose();
        },
        onError: () => toast.error("Fout bij aanmaken"),
      }
    );
  };

  const handleDelete = (id: string, showTitle: string) => {
    if (confirm(`Weet je zeker dat je "${showTitle}" wilt verwijderen?`)) {
      deleteShow.mutate(id, {
        onSuccess: () => toast.success("Verwijderd"),
        onError: () => toast.error("Fout bij verwijderen"),
      });
    }
  };

  const showsWithStatus = shows.map((s) => {
    const checklist = getChecklist(s);
    return {
      ...s,
      progress: getProgressPercent(checklist),
      status: getStatus(checklist),
    };
  });

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Voorstellingen</h2>
          <p className="text-muted-foreground">Seizoen {season}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nieuwe voorstelling
        </Button>
      </div>

      {showsWithStatus.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Geen voorstellingen</p>
            <p className="text-muted-foreground mb-4">Voeg je eerste voorstelling toe voor seizoen {season}</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nieuwe voorstelling
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {showsWithStatus.map((show) => (
            <Card key={show.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {show.hero_image_url ? (
                    <img src={show.hero_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <Image className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{show.title || "Zonder titel"}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {show.genre && (
                      <span className="text-xs text-muted-foreground">{show.genre}</span>
                    )}
                    {show.dates && show.dates.length > 0 && (
                      <span className="text-xs text-muted-foreground">{show.dates[0]}</span>
                    )}
                  </div>
                </div>
                <div className="w-24">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{show.progress}%</span>
                  </div>
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(show.id, show.title)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe voorstelling</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Titel *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Naam van de voorstelling"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Genre</label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Kies een genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Annuleren</Button>
            <Button onClick={handleCreate} disabled={createShow.isPending}>
              {createShow.isPending ? "Bezig..." : "Aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
