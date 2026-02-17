import { useState, useRef, useMemo, useEffect, useCallback, ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import mammoth from "mammoth";
import {
  Plus, Trash2, Image, Search, Edit3, Copy, LayoutGrid, X, Upload, Calendar, Euro, Tag, Theater,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileDropZone } from "@/components/FileDropZone";
import { SortableList } from "@/components/SortableList";
import { useSortOrder } from "@/hooks/useSortOrder";
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
import type { ShowWithImages, ShowImage } from "@/lib/showStatus";
import type { TablesInsert } from "@/integrations/supabase/types";
import {
  getChecklist, getProgressPercent, getStatus, getStatusLabel,
  statusColor, statusTextColor, statusBgLight,
} from "@/lib/showStatus";
import {
  useCreateShow, useUpdateShow, useDeleteShow, useDuplicateShow,
  uploadShowImage, deleteShowImage, useAddSceneImage, useDeleteSceneImage,
} from "@/hooks/useShows";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/RichTextEditor";

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

// ─── Sortable form fields ───
interface FormFieldsSortableProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  editingShow: ShowWithImages | null;
  season: string;
  heroInputRef: React.RefObject<HTMLInputElement>;
  sceneInputRef: React.RefObject<HTMLInputElement>;
  textInputRef: React.RefObject<HTMLInputElement>;
  heroUploading: boolean;
  sceneUploading: boolean;
  handleHeroUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveHero: () => void;
  handleSceneUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteScene: (id: string, url: string) => void;
  handleTextUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setDateAt: (index: number, val: string) => void;
  addDate: () => void;
  removeDate: (index: number) => void;
  sceneImages: ShowImage[];
}

function FormFieldsSortable(props: FormFieldsSortableProps) {
  const {
    form, setForm, editingShow, season,
    heroInputRef, sceneInputRef, textInputRef,
    heroUploading, sceneUploading,
    handleHeroUpload, handleRemoveHero, handleSceneUpload, handleDeleteScene, handleTextUpload,
    setDateAt, addDate, removeDate, sceneImages,
  } = props;

  const FIELD_IDS = ["title", "subtitle", "dates", "times", "prices", "genre", "description", "hero", ...(editingShow ? ["scenes"] : []), "notes"];
  const { orderedIds: fieldOrder, updateOrder: updateFieldOrder } = useSortOrder(
    "voorstellingen-form-fields",
    FIELD_IDS
  );

  const fieldRenderers: Record<string, (dragHandle: ReactNode) => ReactNode> = {
    title: (dh) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1">{dh}<Label>Titel *</Label></div>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Bijv. Jan Smit" />
      </div>
    ),
    subtitle: (dh) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1">{dh}<Label>Ondertitel</Label></div>
        <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Bijv. In Concert" />
      </div>
    ),
    dates: (dh) => (
      <div className="space-y-2">
        <div className="flex items-center gap-1">{dh}<Label>Datum(s)</Label></div>
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
                  onSelect={(date) => { if (date) setDateAt(i, format(date, "yyyy-MM-dd")); }}
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
    ),
    times: (dh) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1">{dh}<Label>Tijden</Label></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Begintijd</Label>
            <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Eindtijd</Label>
            <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
          </div>
        </div>
      </div>
    ),
    prices: (dh) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1">{dh}<Label>Prijzen</Label></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ticketprijs</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="number" step="0.01" min="0" className="pl-9"
                value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kortingsprijs</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="number" step="0.01" min="0" className="pl-9"
                value={form.discount_price} onChange={e => setForm(f => ({ ...f, discount_price: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>
    ),
    genre: (dh) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1">{dh}<Label>Genre</Label></div>
        <Select value={form.genre} onValueChange={v => setForm(f => ({ ...f, genre: v }))}>
          <SelectTrigger><SelectValue placeholder="Kies een genre" /></SelectTrigger>
          <SelectContent>
            {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    ),
    description: (dh) => (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {dh}
          <Label>Beschrijving</Label>
          {form.text_filename && <span className="text-xs text-status-done">{form.text_filename}</span>}
        </div>
        <RichTextEditor
          value={form.description_text}
          onChange={(html) => setForm(f => ({ ...f, description_text: html }))}
          placeholder="Plak of typ hier de beschrijving..."
        />
        <input ref={textInputRef} type="file" accept=".txt,.pdf,.docx" className="hidden" onChange={handleTextUpload} />
        <Button variant="outline" size="sm" onClick={() => textInputRef.current?.click()} className="gap-2">
          <Upload className="h-4 w-4" /> Tekst importeren uit bestand
        </Button>
      </div>
    ),
    hero: (dh) => (
      <div className="space-y-2">
        <div className="flex items-center gap-1">{dh}<Label>Voorstellingsbeeld *</Label></div>
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
    ),
    scenes: (dh) => editingShow ? (
      <div className="space-y-2">
        <div className="flex items-center gap-1">{dh}<Label>Scenefoto's</Label></div>
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
    ) : null,
    notes: (dh) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1">{dh}<Label>Notities</Label></div>
        <Textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={2}
          placeholder="Bijv. 'Wacht nog op beeld van impresariaat'"
        />
      </div>
    ),
  };

  const sortableFields = fieldOrder.map((id) => ({ id }));

  return (
    <SortableList
      items={sortableFields}
      onReorder={(newItems) => updateFieldOrder(newItems.map((i) => i.id))}
      className="space-y-5"
      renderItem={(item, dragHandle) => fieldRenderers[item.id]?.(dragHandle) || null}
    />
  );
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
  useEffect(() => {
    if (openNewDialog && !modalOpen) {
      setModalOpen(true);
      setEditingShow(null);
      setForm(emptyForm());
      onNewDialogClose?.();
    }
  }, [openNewDialog]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const payload: Omit<TablesInsert<"shows">, "season"> = {
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
        await createShow.mutateAsync(payload as Omit<typeof payload, never> & { title: string });
        toast.success("Voorstelling aangemaakt");
      }
      closeModal();
    } catch {
      toast.error("Fout bij opslaan");
    }
  };

  const handleDelete = (id: string) => {
    deleteShow.mutate(id, {
      onSuccess: () => toast.success("Verwijderd"),
      onError: () => toast.error("Fout bij verwijderen"),
    });
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
  const processTextFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "txt") {
      const text = await file.text();
      setForm(f => ({ ...f, description_text: text, text_filename: file.name }));
      toast.success(`Tekst uit "${file.name}" geïmporteerd`);
    } else if (ext === "docx") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setForm(f => ({ ...f, description_text: result.value, text_filename: file.name }));
        toast.success(`Tekst uit "${file.name}" geëxtraheerd`);
        if (result.messages.length > 0) {
          console.warn("Mammoth warnings:", result.messages);
        }
      } catch {
        toast.error(`Kon "${file.name}" niet verwerken`);
      }
    } else {
      toast.info("Alleen .txt en .docx bestanden worden ondersteund voor tekst.");
    }
  }, []);

  const handleTextUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processTextFile(file);
    if (textInputRef.current) textInputRef.current.value = "";
  };

  // ─── Drag & drop handler ───
  const handleDroppedFiles = useCallback(async (files: File[]) => {
    const imageFiles: File[] = [];
    let textFile: File | null = null;

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        imageFiles.push(file);
      } else {
        // Take the first text/docx file
        if (!textFile) textFile = file;
      }
    }

    // Process text file
    if (textFile) {
      await processTextFile(textFile);
    }

    // Process images
    if (imageFiles.length > 0) {
      // If no hero image yet, use the first image as hero
      if (!form.hero_image_url && imageFiles.length > 0) {
        const heroFile = imageFiles.shift()!;
        setHeroUploading(true);
        try {
          const showId = editingShow?.id || "new";
          const url = await uploadShowImage(heroFile, showId);
          setForm(f => ({ ...f, hero_image_url: url }));
          toast.success("Voorstellingsbeeld toegevoegd");
        } catch {
          toast.error("Fout bij uploaden afbeelding");
        } finally {
          setHeroUploading(false);
        }
      }

      // Remaining images as scene images (only when editing existing show)
      if (imageFiles.length > 0 && editingShow) {
        setSceneUploading(true);
        try {
          for (const file of imageFiles) {
            const url = await uploadShowImage(file, editingShow.id);
            await addSceneImage.mutateAsync({ showId: editingShow.id, fileUrl: url, fileName: file.name });
          }
          toast.success(`${imageFiles.length} scenefoto('s) toegevoegd`);
        } catch {
          toast.error("Fout bij uploaden foto's");
        } finally {
          setSceneUploading(false);
        }
      } else if (imageFiles.length > 0 && !editingShow) {
        toast.info("Sla de voorstelling eerst op om scenefoto's toe te voegen.");
      }
    }
  }, [form.hero_image_url, editingShow, processTextFile, addSceneImage]);

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
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-muted p-6 mb-5">
              <Theater className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Geen voorstellingen</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              Er zijn nog geen voorstellingen voor seizoen {season}. Voeg je eerste voorstelling toe om te beginnen.
            </p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Maak een voorstelling aan
            </Button>
          </div>
        ) : (
          /* GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(show)}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bewerken</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(show)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Dupliceren</TooltipContent>
                      </Tooltip>
                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Verwijderen</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Voorstelling verwijderen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet je zeker dat je "{show.title}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleer</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(show.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Verwijderen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TooltipProvider>
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
          <FileDropZone onFilesDropped={handleDroppedFiles} disabled={heroUploading || sceneUploading} className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
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

              <FormFieldsSortable
                form={form}
                setForm={setForm}
                editingShow={editingShow}
                season={season}
                heroInputRef={heroInputRef}
                sceneInputRef={sceneInputRef}
                textInputRef={textInputRef}
                heroUploading={heroUploading}
                sceneUploading={sceneUploading}
                handleHeroUpload={handleHeroUpload}
                handleRemoveHero={handleRemoveHero}
                handleSceneUpload={handleSceneUpload}
                handleDeleteScene={handleDeleteScene}
                handleTextUpload={handleTextUpload}
                setDateAt={setDateAt}
                addDate={addDate}
                removeDate={removeDate}
                sceneImages={sceneImages}
              />
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
          </FileDropZone>
        </div>
      )}
    </>
  );
}
