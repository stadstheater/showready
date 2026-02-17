import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { Settings, Plus, X } from "lucide-react";
import { SortableList } from "@/components/SortableList";
import { useSortOrder } from "@/hooks/useSortOrder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { toast } from "sonner";

const SEASONS = ["auto", "23/24", "24/25", "25/26", "26/27", "27/28"];

const AI_MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (snel)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { value: "openai/gpt-5", label: "GPT-5" },
];

interface SettingsTabProps {
  season: string;
  showCount: number;
}

export function SettingsTab({ season, showCount }: SettingsTabProps) {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [newGenre, setNewGenre] = useState("");

  const save = useCallback(
    (key: string, value: any) => {
      if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
      debounceTimers.current[key] = setTimeout(() => {
        updateSetting.mutate(
          { key, value },
          { onSuccess: () => toast.success("Instellingen opgeslagen") }
        );
      }, 400);
    },
    [updateSetting]
  );

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const genres: string[] = settings.genres || [];
  const aiModel: string = settings.ai_model || "google/gemini-3-flash-preview";
  const aiMaxWords: number = settings.ai_max_words || 150;
  const defaultSeason: string = settings.default_season || "auto";
  const defaultStartTime: string = settings.default_start_time || "20:00";
  const defaultEndTime: string = settings.default_end_time || "22:00";

  const addGenre = () => {
    const trimmed = newGenre.trim();
    if (!trimmed || genres.includes(trimmed)) return;
    const updated = [...genres, trimmed];
    save("genres", updated);
    setNewGenre("");
  };

  const removeGenre = (genre: string) => {
    save("genres", genres.filter((g) => g !== genre));
  };

  const SETTINGS_SECTIONS = ["season", "ai", "genres", "times", "info"];
  const { orderedIds: sectionOrder, updateOrder: updateSectionOrder } = useSortOrder(
    "settings-sections",
    SETTINGS_SECTIONS
  );

  const sectionRenderers: Record<string, (dragHandle: ReactNode) => ReactNode> = {
    season: (dragHandle) => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">{dragHandle} Standaard seizoen</CardTitle>
          <CardDescription>Het seizoen dat standaard wordt geladen bij het openen van de app.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={defaultSeason} onValueChange={(v) => save("default_season", v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEASONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "auto" ? "Automatisch (huidig seizoen)" : `Seizoen ${s}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    ),

    ai: (dragHandle) => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">{dragHandle} AI-instellingen</CardTitle>
          <CardDescription>Model en woordlimiet voor automatische tekstoptimalisatie.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>AI-model</Label>
            <Select value={aiModel} onValueChange={(v) => save("ai_model", v)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Maximaal aantal woorden</Label>
            <Input
              type="number"
              className="w-32"
              defaultValue={aiMaxWords}
              min={50}
              max={500}
              onChange={(e) => save("ai_max_words", parseInt(e.target.value) || 150)}
            />
          </div>
        </CardContent>
      </Card>
    ),

    genres: (dragHandle) => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">{dragHandle} Genres</CardTitle>
          <CardDescription>Beheer de genres die beschikbaar zijn bij voorstellingen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <Badge key={genre} variant="secondary" className="gap-1 pr-1">
                {genre}
                <button
                  onClick={() => removeGenre(genre)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nieuw genre..."
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGenre()}
              className="w-48"
            />
            <Button size="sm" variant="outline" onClick={addGenre}>
              <Plus className="h-4 w-4 mr-1" />
              Toevoegen
            </Button>
          </div>
        </CardContent>
      </Card>
    ),

    times: (dragHandle) => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">{dragHandle} Standaard tijden</CardTitle>
          <CardDescription>Worden als standaard ingevuld bij nieuwe voorstellingen.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="space-y-2">
            <Label>Begintijd</Label>
            <Input
              type="time"
              className="w-32"
              defaultValue={defaultStartTime}
              onChange={(e) => save("default_start_time", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Eindtijd</Label>
            <Input
              type="time"
              className="w-32"
              defaultValue={defaultEndTime}
              onChange={(e) => save("default_end_time", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    ),

    info: (dragHandle) => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">{dragHandle} Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Huidig seizoen: {season}</p>
          <p>Voorstellingen dit seizoen: {showCount}</p>
          <p>App versie: 1.0.0</p>
        </CardContent>
      </Card>
    ),
  };

  const sortableSections = sectionOrder.map((id) => ({ id }));

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Instellingen</h2>
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
