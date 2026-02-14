export interface ShowChecklist {
  title: boolean;
  date: boolean;
  price: boolean;
  text: boolean;
  heroImage: boolean;
  seoKeyword: boolean;
  metaDescription: boolean;
  webText: boolean;
  cropHero: boolean;
  cropUitlichten: boolean;
  cropNarrow: boolean;
  cropSlider: boolean;
}

export interface ShowImage {
  id: string;
  type: string;
  file_url: string;
  file_name: string | null;
  alt_text: string | null;
  position: number | null;
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
    metaDescription: !!show.seo_meta_description && show.seo_meta_description.trim().length >= 50,
    webText: !!show.web_text && show.web_text.trim().length > 0,
    cropHero: images.some(i => i.type === "crop_hero"),
    cropUitlichten: images.some(i => i.type === "crop_uitlichten"),
    cropNarrow: images.some(i => i.type === "crop_narrow"),
    cropSlider: images.some(i => i.type === "crop_slider"),
  };
}

export function getCompletedCount(checklist: ShowChecklist): number {
  return Object.values(checklist).filter(Boolean).length;
}

export function getProgressPercent(checklist: ShowChecklist): number {
  return Math.round((getCompletedCount(checklist) / 12) * 100);
}

export type ShowStatus = "todo" | "bezig" | "afgerond";

export function getStatus(checklist: ShowChecklist): ShowStatus {
  const count = getCompletedCount(checklist);
  if (count === 0) return "todo";
  if (count === 12) return "afgerond";
  return "bezig";
}

export function getStatusLabel(status: ShowStatus): string {
  switch (status) {
    case "todo": return "To-do";
    case "bezig": return "Bezig";
    case "afgerond": return "Afgerond";
  }
}
