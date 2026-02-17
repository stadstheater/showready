import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Monitor, CheckCircle2, Check, AlertTriangle, Globe, Search,
  Type, Info, Eye, EyeOff, Sparkles, Loader2, ClipboardCopy,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn, toSlug } from "@/lib/utils";
import type { ShowWithImages } from "@/lib/showStatus";
import {
  getChecklist, getProgressPercent, getStatus, getStatusLabel,
  statusColor,
  type ShowChecklist, type ShowStatus,
} from "@/lib/showStatus";
import { useUpdateShow } from "@/hooks/useShows";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageCropSection } from "@/components/ImageCropSection";

interface WebsiteTabProps {
  season: string;
  shows: ShowWithImages[];
}

// ─── Helpers ───
function formatDateShort(dateStr: string) {
  try {
    return format(parseISO(dateStr), "EEE d MMM yyyy", { locale: nl });
  } catch {
    return dateStr;
  }
}

const CHECKLIST_LABELS: Record<keyof ShowChecklist, string> = {
  title: "Titel",
  date: "Datum",
  price: "Prijs",
  text: "Tekst",
  heroImage: "Hoofdafbeelding",
  seoKeyword: "SEO zoekwoord",
  metaDescription: "Meta-omschrijving",
  webText: "Webtekst",
  cropHero: "Crop: Hero",
  cropUitlichten: "Crop: Uitlichten",
  cropNarrow: "Crop: Smal",
  cropSlider: "Crop: Slider",
};

export function WebsiteTab({ season, shows }: WebsiteTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoKeyword, setSeoKeyword] = useState("");
  const [seoMeta, setSeoMeta] = useState("");
  const [seoSlug, setSeoSlug] = useState("");
  const [webText, setWebText] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateShow = useUpdateShow(season);

  // Filter eligible shows
  const eligible = useMemo(
    () =>
      shows.filter(
        (s) =>
          s.title.trim().length > 0 &&
          s.dates &&
          s.dates.length > 0 &&
          !!s.hero_image_url
      ),
    [shows]
  );

  const selected = useMemo(
    () => eligible.find((s) => s.id === selectedId) || null,
    [eligible, selectedId]
  );

  // Populate fields when a different show is selected
  const selectedUpdatedAt = selected?.updated_at;
  useEffect(() => {
    if (!selected) return;
    const autoTitle = [selected.title, selected.subtitle, "Stadstheater Zoetermeer"]
      .filter(Boolean)
      .join(" | ");
    const autoMeta = selected.description_text
      ? selected.description_text.slice(0, 155) + (selected.description_text.length > 155 ? "..." : "")
      : "";
    const autoSlug = toSlug(selected.title, selected.subtitle);

    setSeoTitle(selected.seo_title || autoTitle);
    setSeoKeyword(selected.seo_keyword || "");
    setSeoMeta(selected.seo_meta_description || autoMeta);
    setSeoSlug(selected.seo_slug || autoSlug);
    setWebText(selected.web_text || selected.description_text || "");
    setShowOriginal(false);
  }, [selected?.id, selectedUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save with debounce
  const autoSave = useCallback(
    (fields: Partial<Pick<ShowWithImages, "seo_title" | "seo_keyword" | "seo_meta_description" | "seo_slug" | "web_text">>) => {
      if (!selected) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateShow.mutate({ id: selected.id, ...fields });
      }, 400);
    },
    [selected, updateShow]
  );

  const handleSeoTitle = (v: string) => { setSeoTitle(v); autoSave({ seo_title: v }); };
  const handleSeoKeyword = (v: string) => { setSeoKeyword(v); autoSave({ seo_keyword: v }); };
  const handleSeoMeta = (v: string) => { setSeoMeta(v); autoSave({ seo_meta_description: v }); };
  const handleSeoSlug = (v: string) => { setSeoSlug(v); autoSave({ seo_slug: v }); };
  const handleWebText = (v: string) => { setWebText(v); autoSave({ web_text: v }); };

  // AI optimize
  const handleOptimize = async () => {
    if (!selected) return;
    const sourceText = selected.description_text || webText;
    if (!sourceText.trim()) {
      toast.error("Geen tekst beschikbaar om te optimaliseren");
      return;
    }
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-text", {
        body: {
          text: sourceText,
          keyword: seoKeyword || selected.title,
          title: selected.title,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = data.text || "";
      setWebText(result);
      setShowOriginal(false);
      autoSave({ web_text: result });
      toast.success("Tekst geoptimaliseerd");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout bij optimaliseren");
    } finally {
      setOptimizing(false);
    }
  };

  // Copy practical info
  const handleCopy = () => {
    if (!selected) return;
    const lines: string[] = [];
    if (selected.dates && selected.dates.length > 0) {
      lines.push("Datum: " + selected.dates.map(formatDateShort).join(", "));
    }
    if (selected.start_time) {
      lines.push(`Tijd: ${selected.start_time}${selected.end_time ? ` – ${selected.end_time} uur` : ""}`);
    }
    if (selected.price != null) {
      let price = `Prijs: € ${selected.price.toFixed(2).replace(".", ",")}`;
      if (selected.discount_price != null) {
        price += ` (korting: € ${selected.discount_price.toFixed(2).replace(".", ",")})`;
      }
      lines.push(price);
    }
    if (selected.genre) lines.push(`Genre: ${selected.genre}`);
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checklist = selected ? getChecklist(selected) : null;
  const progress = checklist ? getProgressPercent(checklist) : 0;
  const wordCount = webText.trim().split(/\s+/).filter(Boolean).length;
  const metaLen = seoMeta.length;
  const metaColor = metaLen >= 120 && metaLen <= 160 ? "text-status-done" : "text-status-todo";

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* ─── LEFT SIDEBAR ─── */}
      <div className="w-72 shrink-0 border-r border-border overflow-y-auto p-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Voorstellingen ({eligible.length})
        </p>
        {eligible.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Geen voorstellingen met voldoende gegevens — vul titel, datum en afbeelding in
          </p>
        ) : (
          eligible.map((show) => {
            const st = getStatus(getChecklist(show));
            const active = show.id === selectedId;
            return (
              <button
                key={show.id}
                onClick={() => setSelectedId(show.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  active
                    ? "bg-accent border border-border"
                    : "hover:bg-accent/50"
                )}
              >
                <div className="w-12 h-8 shrink-0 rounded overflow-hidden bg-muted">
                  {show.hero_image_url ? (
                    <img src={show.hero_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{show.title}</p>
                  {show.subtitle && (
                    <p className="text-[11px] text-muted-foreground truncate">{show.subtitle}</p>
                  )}
                </div>
                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", statusColor(st))} />
              </button>
            );
          })
        )}
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Monitor className="h-16 w-16 mb-4 opacity-40" />
            <p className="text-lg">Selecteer een voorstelling</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4">
              {selected.hero_image_url && (
                <img src={selected.hero_image_url} alt="" className="w-16 h-12 rounded-lg object-cover" />
              )}
              <div>
                <h2 className="text-xl font-bold text-card-foreground">{selected.title}</h2>
                {selected.subtitle && (
                  <p className="text-sm text-muted-foreground">{selected.subtitle}</p>
                )}
              </div>
            </div>

            {/* SECTIE 1: CHECKLIST */}
            <Card className="bg-accent/50 border-border">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-card-foreground">Checklist</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {checklist &&
                    (Object.entries(checklist) as [keyof ShowChecklist, boolean][]).map(
                      ([key, done]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          {done ? (
                            <Check className="h-4 w-4 text-status-done" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-status-todo" />
                          )}
                          <span className={done ? "text-card-foreground" : "text-muted-foreground"}>
                            {CHECKLIST_LABELS[key]}
                          </span>
                        </div>
                      )
                    )}
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SECTIE 2: SEO & METADATA */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-card-foreground">SEO & Metadata</h3>
              </div>

              <div className="space-y-1">
                <Label>SEO-titel</Label>
                <Input value={seoTitle} onChange={(e) => handleSeoTitle(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>Focus zoekwoord</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={seoKeyword}
                    onChange={(e) => handleSeoKeyword(e.target.value)}
                    placeholder="bijv. cabaret Zoetermeer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>Meta-omschrijving</Label>
                  <span className={cn("text-xs", metaColor)}>{metaLen} tekens</span>
                </div>
                <Textarea
                  rows={2}
                  value={seoMeta}
                  onChange={(e) => handleSeoMeta(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>URL-slug</Label>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground px-3 py-2 border border-r-0 border-border rounded-l-md bg-muted">
                    stadstheaterzoetermeer.nl/
                  </span>
                  <Input
                    className="rounded-l-none"
                    value={seoSlug}
                    onChange={(e) => handleSeoSlug(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SECTIE 3: WEBTEKST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-card-foreground">Webtekst</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setShowOriginal(!showOriginal)}
                >
                  {showOriginal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showOriginal ? "Toon bewerkt" : "Toon origineel"}
                </Button>
              </div>

              <Textarea
                rows={6}
                value={showOriginal ? (selected.description_text || "") : webText}
                onChange={(e) => {
                  if (!showOriginal) handleWebText(e.target.value);
                }}
                readOnly={showOriginal}
                className={showOriginal ? "opacity-70" : ""}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{wordCount} woorden</span>
                <Button
                  size="sm"
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {optimizing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Bezig...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Optimaliseer tekst
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* SECTIE 4: PRAKTISCHE INFO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-card-foreground">Praktische info</h3>
              </div>

              <div className="rounded-lg border border-border bg-accent/30 p-4 font-mono text-xs text-card-foreground space-y-1">
                {selected.dates && selected.dates.length > 0 && (
                  <p>Datum: {selected.dates.map(formatDateShort).join(", ")}</p>
                )}
                {selected.start_time && (
                  <p>
                    Tijd: {selected.start_time}
                    {selected.end_time ? ` – ${selected.end_time} uur` : ""}
                  </p>
                )}
                {selected.price != null && (
                  <p>
                    Prijs: € {selected.price.toFixed(2).replace(".", ",")}
                    {selected.discount_price != null &&
                      ` (korting: € ${selected.discount_price.toFixed(2).replace(".", ",")})`}
                  </p>
                )}
                {selected.genre && <p>Genre: {selected.genre}</p>}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-status-done" /> Gekopieerd!
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-4 w-4" /> Kopieer praktische info
                  </>
                )}
              </Button>
            </div>

            {/* SECTIE 5 & 6: AFBEELDINGEN & ALT-TEKSTEN */}
            <ImageCropSection show={selected} season={season} />
          </>
        )}
      </div>
    </div>
  );
}
