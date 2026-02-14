import { useState, useRef, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Plus, Trash2, Image, Search, Edit3, Copy, LayoutGrid, X, Upload, Calendar, Euro, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { ShowWithImages, ShowStatus } from "@/lib/showStatus";
import {
  getChecklist, getProgressPercent, getStatus, getStatusLabel,
} from "@/lib/showStatus";
import {
  useCreateShow, useUpdateShow, useDeleteShow, useDuplicateShow,
  uploadShowImage, deleteShowImage, useAddSceneImage, useDeleteSceneImage,
} from "@/hooks/useShows";
import { toast } from "sonner";

interface VoorstellingenTabProps {
  season: string;
  shows: ShowWithImages[];
  openNewDialog?: boolean;
  onNewDialogClose?: () => void;
}

const GENRES = [
  "Cabaret", "Muziek", "Theater", "Musical", "Jeugd & Familie",
  "Dans", "Cultureel initiatief", "Klassieke Muziek", "Show",
  "Toneel", "Theatercollege", "Muziektheater",
] as const;

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
    case "todo": return "bg-status-todo/15";
    case "bezig": return "bg-status-busy/15";
    case "afgerond": return "bg-status-done/15";
  }
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "EEE d MMM yyyy", { locale: nl });
  } catch {
    return dateStr;
  }
}

function formatPrice(n: number | null) {
  if (n == null) return null;
  return `€ ${n.toFixed(2).replace(".", ",")}`;
}

// ─── Form state ───
interface FormState {
  title: string;
  subtitle: string;
  dates: string[];
  start_time: string;
  end_time: string;
  price: string;
  discount_price: string;
  genre: string;
  description_text: string;
  text_filename: string;
  notes: string;
  hero_image_url: string | null;
}

function emptyForm(): FormState {
  return {
    title: "", subtitle: "", dates: [""],
    start_time: "20:00", end_time: "22:00",
    price: "", discount_price: "", genre: "",
    description_text: "", text_filename: "",
    notes: "", hero_image_url: null,
  };
}

function showToForm(show: ShowWithImages): FormState {
  return {
    title: show.title || "",
    subtitle: show.subtitle || "",
    dates: show.dates && show.dates.length > 0 ? [...show.dates] : [""],
    start_time: show.start_time || "20:00",
    end_time: show.end_time || "22:00",
    price: show.price != null ? String(show.price) : "",
    discount_price: show.discount_price != null ? String(show.discount_price) : "",
    genre: show.genre || "",
    description_text: show.description_text || "",
    text_filename: show.text_filename || "",
    notes: show.notes || "",
    hero_image_url: show.hero_image_url || null,
  };
}

export function VoorstellingenTab({ season, shows, openNewDialog, onNewDialogClose }: VoorstellingenTabProps) {
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<ShowWithImages | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [heroUploading, setHeroUploading] = useState(false);
  const [sceneUploading, setSceneUploading] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const sceneInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const createShow = useCreateShow(season);
  const updateShow = useUpdateShow(season);
  const deleteShow = useDeleteShow();
  const duplicateShow = useDuplicateShow(season);
  const addSceneImage = useAddSceneImage();
  const deleteSceneImage = useDeleteSceneImage();

  // Open modal from parent
  if (openNewDialog && !modalOpen) {
    setModalOpen(true);
    setEditingShow(null);
    setForm(emptyForm());
    onNewDialogClose?.();
  }

  const showsWithStatus = useMemo(() =>
    shows.map((s) => {
      const checklist = getChecklist(s);
      return { ...s, progress: getProgressPercent(checklist), status: getStatus(checklist) };
    }), [shows]);

  const filtered = useMemo(() => {
    let result = showsWithStatus;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) || (s.subtitle || "").toLowerCase().includes(q)
      );
    }
    if (genreFilter !== "all") {
      result = result.filter(s => s.genre === genreFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter(s => s.status === statusFilter);
    }
    return result;
  }, [showsWithStatus, search, genreFilter, statusFilter]);

  // ─── Modal handlers ───
  const openCreate = () => {
    setEditingShow(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (show: ShowWithImages) => {
    setEditingShow(show);
    setForm(showToForm(show));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingShow(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Vul een titel in");
      return;
    }
    const payload: any = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      dates: form.dates.filter(d => d.trim()),
      start_time: form.start_time || "20:00",
      end_time: form.end_time || "22:00",
      price: form.price ? parseFloat(form.price) : null,
      discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
      genre: form.genre || null,
      description_text: form.description_text.trim() || null,
      text_filename: form.text_filename || null,
      notes: form.notes.trim() || null,
      hero_image_url: form.hero_image_url || null,
    };

    try {
      if (editingShow) {
        await updateShow.mutateAsync({ id: editingShow.id, ...payload });
        toast.success("Voorstelling opgeslagen");
      } else {
        await createShow.mutateAsync(payload);
        toast.success("Voorstelling aangemaakt");
      }
      closeModal();
    } catch {
      toast.error("Fout bij opslaan");
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) {
      deleteShow.mutate(id, {
        onSuccess: () => toast.success("Verwijderd"),
        onError: () => toast.error("Fout bij verwijderen"),
      });
    }
  };

  const handleDuplicate = (show: ShowWithImages) => {
    duplicateShow.mutate(show, {
      onSuccess: () => toast.success("Voorstelling gedupliceerd"),
      onError: () => toast.error("Fout bij dupliceren"),
    });
  };

  // ─── Image uploads ───
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const showId = editingShow?.id || "new";
      const url = await uploadShowImage(file, showId);
      setForm(f => ({ ...f, hero_image_url: url }));
    } catch {
      toast.error("Fout bij uploaden afbeelding");
    } finally {
      setHeroUploading(false);
      if (heroInputRef.current) heroInputRef.current.value = "";
    }
  };

  const handleRemoveHero = async () => {
    if (form.hero_image_url) {
      try { await deleteShowImage(form.hero_image_url); } catch { /* ignore */ }
    }
    setForm(f => ({ ...f, hero_image_url: null }));
  };

  const handleSceneUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingShow) return;
    setSceneUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadShowImage(file, editingShow.id);
        await addSceneImage.mutateAsync({ showId: editingShow.id, fileUrl: url, fileName: file.name });
      }
    } catch {
      toast.error("Fout bij uploaden foto's");
    } finally {
      setSceneUploading(false);
      if (sceneInputRef.current) sceneInputRef.current.value = "";
    }
  };

  const handleDeleteScene = (imgId: string, fileUrl: string) => {
    deleteSceneImage.mutate({ id: imgId, fileUrl });
  };

  // ─── Text file upload ───
  const handleTextUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setForm(f => ({ ...f, description_text: text, text_filename: file.name }));
    } catch {
      toast.error("Kon bestand niet lezen");
    }
    if (textInputRef.current) textInputRef.current.value = "";
  };

  // ─── Date helpers ───
  const setDateAt = (index: number, val: string) => {
    setForm(f => {
      const dates = [...f.dates];
      dates[index] = val;
      return { ...f, dates };
    });
  };
  const addDate = () => setForm(f => ({ ...f, dates: [...f.dates, ""] }));
  const removeDate = (index: number) => {
    if (form.dates.length <= 1) return;
    setForm(f => ({ ...f, dates: f.dates.filter((_, i) => i !== index) }));
  };

  const sceneImages = editingShow?.show_images?.filter(i => i.type === "scene") || [];

  return (
    <>
      <div className="container py-6 space-y-6">
        {/* TOOLBAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek op titel of ondertitel..."
              className="pl-9"
            />
          </div>
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Alle genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle genres</SelectItem>
              {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Alle statussen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="todo">To-do</SelectItem>
              <SelectItem value="bezig">Bezig</SelectItem>
              <SelectItem value="afgerond">Afgerond</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="gap-2 ml-auto">
            <Plus className="h-4 w-4" />
            Nieuwe voorstelling
          </Button>
        </div>

        {/* EMPTY STATE */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <LayoutGrid className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <p className="text-lg text-muted-foreground">
              Nog geen voorstellingen in seizoen {season}
            </p>
            <button
              onClick={openCreate}
              className="mt-2 text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Nieuwe voorstelling toevoegen
            </button>
          </div>
        ) : (
          /* GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((show) => (
              <Card key={show.id} className="overflow-hidden border-border bg-card group">
                {/* Cover image */}
                <div className="relative h-40 overflow-hidden bg-muted">
                  {show.hero_image_url ? (
                    <img
                      src={show.hero_image_url}
                      alt={show.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Image className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
                  {/* Progress bar */}
                  <div className="absolute inset-x-0 bottom-0 h-[2px]">
                    <div
                      className={`h-full ${statusColor(show.status)} transition-all`}
                      style={{ width: `${show.progress}%` }}
                    />
                  </div>
                </div>

                {/* Body */}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-card-foreground truncate">{show.title || "Zonder titel"}</p>
                      {show.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{show.subtitle}</p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] shrink-0 ${statusTextColor(show.status)} ${statusBgLight(show.status)} border-0`}
                    >
                      {getStatusLabel(show.status)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {show.dates && show.dates.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(show.dates[0])}
                      </span>
                    )}
                    {show.price != null && (
                      <span className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {formatPrice(show.price)}
                      </span>
                    )}
                    {show.genre && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {show.genre}
                      </span>
                    )}
                  </div>

                  {show.notes && (
                    <p className="text-xs italic text-muted-foreground truncate">{show.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => openEdit(show)}>
                      <Edit3 className="h-3.5 w-3.5" /> Bewerk
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleDuplicate(show)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs ml-auto hover:text-destructive"
                      onClick={() => handleDelete(show.id, show.title)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ─── MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground">
                {editingShow ? "Voorstelling bewerken" : "Nieuwe voorstelling"}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5" style={{ maxHeight: "70vh" }}>
              {/* Season badge */}
              <Badge className="bg-primary text-primary-foreground text-xs">{season}</Badge>

              {/* Title */}
              <div className="space-y-1">
                <Label>Titel *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Bijv. Jan Smit" />
              </div>

              {/* Subtitle */}
              <div className="space-y-1">
                <Label>Ondertitel</Label>
                <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Bijv. In Concert" />
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <Label>Datum(s)</Label>
                {form.dates.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !d && "text-muted-foreground")}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {d ? formatDate(d) : "Kies een datum"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={d ? parseISO(d) : undefined}
                          onSelect={(date) => {
                            if (date) setDateAt(i, format(date, "yyyy-MM-dd"));
                          }}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    {form.dates.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeDate(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="link" className="h-auto p-0 text-primary text-sm" onClick={addDate}>
                  + Datum toevoegen
                </Button>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Begintijd</Label>
                  <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Eindtijd</Label>
                  <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Ticketprijs</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" step="0.01" min="0" className="pl-9"
                      value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Kortingsprijs</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" step="0.01" min="0" className="pl-9"
                      value={form.discount_price} onChange={e => setForm(f => ({ ...f, discount_price: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Genre */}
              <div className="space-y-1">
                <Label>Genre</Label>
                <Select value={form.genre} onValueChange={v => setForm(f => ({ ...f, genre: v }))}>
                  <SelectTrigger><SelectValue placeholder="Kies een genre" /></SelectTrigger>
                  <SelectContent>
                    {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Text upload */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Tekst uploaden</Label>
                  {form.text_filename && (
                    <span className="text-xs text-status-done">{form.text_filename}</span>
                  )}
                </div>
                <input ref={textInputRef} type="file" accept=".txt,.pdf,.docx" className="hidden" onChange={handleTextUpload} />
                <Button variant="outline" size="sm" onClick={() => textInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" /> Bestand kiezen
                </Button>
                {form.description_text && (
                  <Textarea
                    value={form.description_text}
                    onChange={e => setForm(f => ({ ...f, description_text: e.target.value }))}
                    rows={4}
                  />
                )}
              </div>

              {/* Hero image */}
              <div className="space-y-2">
                <Label>Voorstellingsbeeld *</Label>
                <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
                {form.hero_image_url ? (
                  <div className="relative group/hero">
                    <img src={form.hero_image_url} alt="Hero" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/hero:opacity-100 transition-opacity"
                      onClick={handleRemoveHero}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => heroInputRef.current?.click()}
                    disabled={heroUploading}
                    className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
                  >
                    {heroUploading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <>
                        <Image className="h-8 w-8" />
                        <span className="text-sm">Klik om afbeelding te uploaden</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Scene photos (only when editing) */}
              {editingShow && (
                <div className="space-y-2">
                  <Label>Scenefoto's</Label>
                  <input ref={sceneInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSceneUpload} />
                  <div className="grid grid-cols-4 gap-2">
                    {sceneImages.map(img => (
                      <div key={img.id} className="relative group/scene h-20 rounded-lg overflow-hidden bg-muted">
                        <img src={img.file_url} alt={img.alt_text || ""} className="h-full w-full object-cover" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover/scene:opacity-100 transition-opacity"
                          onClick={() => handleDeleteScene(img.id, img.file_url)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <button
                      onClick={() => sceneInputRef.current?.click()}
                      disabled={sceneUploading}
                      className="h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
                    >
                      {sceneUploading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <Plus className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <Label>Notities</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Bijv. 'Wacht nog op beeld van impresariaat'"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <span className="text-xs text-muted-foreground">Seizoen {season}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={closeModal}>Annuleer</Button>
                <Button
                  onClick={handleSave}
                  disabled={createShow.isPending || updateShow.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {(createShow.isPending || updateShow.isPending) ? "Bezig..." : "Opslaan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
