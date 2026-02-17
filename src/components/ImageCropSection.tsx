import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Image, Check, Scissors, ZoomIn, ZoomOut, Download, RefreshCw, Move, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, toSlug } from "@/lib/utils";
import type { ShowWithImages, ShowImage } from "@/lib/showStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// ─── Crop formats ───
export interface CropFormat {
  key: string;
  label: string;
  width: number;
  height: number;
  suffix: string;
  description: string;
  dbType: string; // matches show_images.type
}

export const CROP_FORMATS: CropFormat[] = [
  { key: "hero", label: "Hero", width: 2160, height: 1020, suffix: "-hero", description: "Home & voorstellingspagina", dbType: "crop_hero" },
  { key: "uitlichten", label: "Uitlichten", width: 1080, height: 1080, suffix: "-uitlichten", description: "Vierkant", dbType: "crop_uitlichten" },
  { key: "narrow", label: "Narrow", width: 1650, height: 1080, suffix: "-narrow", description: "Staand formaat", dbType: "crop_narrow" },
  { key: "slider", label: "Slider", width: 1920, height: 1080, suffix: "-slider", description: "Carrousel liggend", dbType: "crop_slider" },
];

function generateFileName(show: ShowWithImages, suffix: string) {
  const slug = toSlug(show.title, show.subtitle);
  return `${slug}${suffix}.webp`;
}

function generateAltText(show: ShowWithImages, label: string) {
  const parts = [show.title, show.subtitle].filter(Boolean).join(" - ");
  return `${parts} in Stadstheater Zoetermeer - ${label.toLowerCase()}`;
}

// ─── Canvas crop helper ───
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number,
  outputHeight: number,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, outputWidth, outputHeight,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/webp",
      0.85,
    );
  });
}

// ─── Component props ───
interface ImageCropSectionProps {
  show: ShowWithImages;
  season: string;
}

export function ImageCropSection({ show, season }: ImageCropSectionProps) {
  const [activeCrop, setActiveCrop] = useState<CropFormat | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const images = show.show_images || [];

  const getCropImage = (dbType: string): ShowImage | undefined =>
    images.find((i) => i.type === dbType);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleStartCrop = (fmt: CropFormat) => {
    setActiveCrop(fmt);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleCancel = () => {
    setActiveCrop(null);
  };

  const handleConfirm = async () => {
    if (!activeCrop || !croppedAreaPixels || !show.hero_image_url) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(
        show.hero_image_url,
        croppedAreaPixels,
        activeCrop.width,
        activeCrop.height,
      );
      const fileName = generateFileName(show, activeCrop.suffix);
      const storagePath = `${show.id}/${fileName}`;
      const altText = generateAltText(show, activeCrop.label);

      // Remove old crop if exists
      const existing = getCropImage(activeCrop.dbType);
      if (existing) {
        const oldPath = existing.file_url.split("/show-assets/")[1];
        if (oldPath) await supabase.storage.from("show-assets").remove([oldPath]);
        await supabase.from("show_images").delete().eq("id", existing.id);
      }

      // Upload new
      const { error: uploadErr } = await supabase.storage
        .from("show-assets")
        .upload(storagePath, blob, { contentType: "image/webp", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("show-assets").getPublicUrl(storagePath);

      await supabase.from("show_images").insert({
        show_id: show.id,
        type: activeCrop.dbType,
        file_url: urlData.publicUrl,
        file_name: fileName,
        alt_text: altText,
        file_size: blob.size,
      });

      queryClient.invalidateQueries({ queryKey: ["shows", season] });
      toast.success(`${activeCrop.label} crop opgeslagen`);
      setActiveCrop(null);
    } catch (e: any) {
      toast.error(e.message || "Fout bij opslaan crop");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (img: ShowImage) => {
    const a = document.createElement("a");
    a.href = img.file_url;
    a.download = img.file_name || "download.webp";
    a.click();
  };

  const handleDownloadAll = () => {
    CROP_FORMATS.forEach((fmt) => {
      const img = getCropImage(fmt.dbType);
      if (img) handleDownload(img);
    });
  };

  const handleUpdateAltText = async (imgId: string, altText: string) => {
    await supabase.from("show_images").update({ alt_text: altText }).eq("id", imgId);
    queryClient.invalidateQueries({ queryKey: ["shows", season] });
  };

  if (!show.hero_image_url) return null;

  const cropImages = CROP_FORMATS.map((fmt) => ({
    fmt,
    img: getCropImage(fmt.dbType),
  }));

  const hasCrops = cropImages.some((c) => c.img);

  return (
    <>
      {/* SECTIE 5: AFBEELDINGEN */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-card-foreground">Afbeeldingen</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cropImages.map(({ fmt, img }) => (
            <div
              key={fmt.key}
              className="rounded-lg border border-border bg-accent/30 p-3 space-y-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground flex items-center gap-1.5">
                    {fmt.label}
                    {img && <Check className="h-3.5 w-3.5 text-status-done" />}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {fmt.width} × {fmt.height} — {fmt.description}
                  </p>
                </div>
              </div>

              {img ? (
                <>
                  <img
                    src={img.file_url}
                    alt={img.alt_text || ""}
                    className="w-full h-20 object-cover rounded"
                  />
                  <p className="text-[10px] text-muted-foreground truncate">{img.file_name}</p>
                  {img.file_size && (
                    <p className="text-[10px] text-muted-foreground">
                      {(img.file_size / 1024).toFixed(0)} KB
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1 flex-1"
                      onClick={() => handleDownload(img)}
                    >
                      <Download className="h-3 w-3" /> Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1 flex-1"
                      onClick={() => handleStartCrop(fmt)}
                    >
                      <RefreshCw className="h-3 w-3" /> Opnieuw
                    </Button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => handleStartCrop(fmt)}
                  className="w-full h-20 border-2 border-dashed border-border rounded flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 transition-colors"
                >
                  <Scissors className="h-5 w-5" />
                  <span className="text-xs">Crop maken</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Download all */}
        {hasCrops && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleDownloadAll}
          >
            <Download className="h-4 w-4" /> Download alle formaten
          </Button>
        )}

        {/* CROP TOOL */}
        {activeCrop && show.hero_image_url && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-card-foreground">
                {activeCrop.label} — {activeCrop.width} × {activeCrop.height}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom((z) => Math.min(5, z + 0.2))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative w-full h-80 bg-background rounded-lg overflow-hidden">
              <Cropper
                image={show.hero_image_url}
                crop={crop}
                zoom={zoom}
                aspect={activeCrop.width / activeCrop.height}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid
                style={{
                  cropAreaStyle: {
                    border: "2px solid #E30613",
                  },
                }}
              />
              {/* Move hint */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Move className="h-8 w-8 text-foreground/20" />
              </div>
            </div>

            <Button
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleConfirm}
              disabled={saving}
            >
              <Scissors className="h-4 w-4" />
              {saving ? "Bezig met opslaan..." : "Crop bevestigen"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleCancel}>
              Annuleer
            </Button>
          </div>
        )}
      </div>

      {/* SECTIE 6: ALT-TEKSTEN */}
      {hasCrops && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-card-foreground">Alt-teksten</h3>
          </div>

          <div className="space-y-3">
            {cropImages
              .filter((c) => c.img)
              .map(({ fmt, img }) => (
                <div key={fmt.key} className="flex items-center gap-3">
                  <img
                    src={img!.file_url}
                    alt=""
                    className="w-12 h-8 rounded object-cover shrink-0"
                  />
                  <Label className="text-xs shrink-0 w-20">{fmt.label}</Label>
                  <Input
                    className="text-xs"
                    defaultValue={img!.alt_text || ""}
                    onBlur={(e) => handleUpdateAltText(img!.id, e.target.value)}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
