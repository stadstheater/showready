export interface ShowChecklist {
  title: boolean;
  date: boolean;
  price: boolean;
  text: boolean;
  heroImage: boolean;
  seoKeyword: boolean;
  webText: boolean;
  cropHero: boolean;
  cropUitlichten: boolean;
  cropNarrow: boolean;
  
}

export interface ShowImage {
  id: string;
  type: string;
  file_url: string;
  file_name: string | null;
  alt_text: string | null;
  position: number | null;
  file_size: number | null;
}

export interface ShowWithImages {
  id: string;
  season: string;
  title: string;
  subtitle: string | null;
  dates: string[] | null;
  start_time: string | null;
  end_time: string | null;
  price: number | null;
  discount_price: number | null;
  genre: string | null;
  description_text: string | null;
  text_filename: string | null;
  notes: string | null;
  hero_image_url: string | null;
  hero_image_preview: string | null;
  seo_title: string | null;
  seo_keyword: string | null;
  seo_meta_description: string | null;
  seo_slug: string | null;
  web_text: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  created_at: string;
  updated_at: string;
  show_images?: ShowImage[];
}

export function getChecklist(show: ShowWithImages): ShowChecklist {
  const images = show.show_images || [];
  return {
    title: !!show.title && show.title.trim().length > 0,
    date: !!show.dates && show.dates.length > 0,
    price: show.price != null && show.price > 0,
    text: !!show.description_text && show.description_text.trim().length > 0,
    heroImage: !!show.hero_image_url,
    seoKeyword: !!show.seo_keyword && show.seo_keyword.trim().length > 0,
    webText: !!show.web_text && show.web_text.trim().length > 0,
    cropHero: images.some(i => i.type === "crop_hero"),
    cropUitlichten: images.some(i => i.type === "crop_uitlichten"),
    cropNarrow: images.some(i => i.type === "crop_narrow"),
    
  };
}

export function getCompletedCount(checklist: ShowChecklist): number {
  return Object.values(checklist).filter(Boolean).length;
}

export function getTotalCount(checklist: ShowChecklist): number {
  return Object.keys(checklist).length;
}

export function getProgressPercent(checklist: ShowChecklist): number {
  const total = getTotalCount(checklist);
  if (total === 0) return 0;
  return Math.round((getCompletedCount(checklist) / total) * 100);
}

export type ShowStatus = "todo" | "bezig" | "afgerond";

export function getStatus(checklist: ShowChecklist): ShowStatus {
  const completed = getCompletedCount(checklist);
  const total = getTotalCount(checklist);
  if (completed === 0) return "todo";
  if (completed === total) return "afgerond";
  return "bezig";
}

export function statusColor(status: ShowStatus): string {
  switch (status) {
    case "todo": return "bg-status-todo";
    case "bezig": return "bg-status-busy";
    case "afgerond": return "bg-status-done";
  }
}

export function statusTextColor(status: ShowStatus): string {
  switch (status) {
    case "todo": return "text-status-todo";
    case "bezig": return "text-status-busy";
    case "afgerond": return "text-status-done";
  }
}

export function statusBgLight(status: ShowStatus): string {
  switch (status) {
    case "todo": return "bg-status-todo/15";
    case "bezig": return "bg-status-busy/15";
    case "afgerond": return "bg-status-done/15";
  }
}

export function getStatusLabel(status: ShowStatus): string {
  switch (status) {
    case "todo": return "To-do";
    case "bezig": return "Bezig";
    case "afgerond": return "Afgerond";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
