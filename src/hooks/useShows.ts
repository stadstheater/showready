import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import type { ShowWithImages } from "@/lib/showStatus";

export function useShows(season: string) {
  return useQuery({
    queryKey: ["shows", season],
    queryFn: async (): Promise<ShowWithImages[]> => {
      const { data, error } = await supabase
        .from("shows")
        .select("*, show_images(id, type, file_url, file_name, alt_text, position, file_size)")
        .eq("season", season)
        .order("title", { ascending: true });

      if (error) throw error;
      return (data || []) as ShowWithImages[];
    },
  });
}

export function useCreateShow(season: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (show: Partial<ShowWithImages> & { title: string }) => {
      const { data, error } = await supabase
        .from("shows")
        .insert({ ...show, season })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows", season] });
    },
  });
}

export function useUpdateShow(season: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShowWithImages> & { id: string }) => {
      const { show_images, created_at, updated_at, ...cleanUpdates } = updates;
      const { data, error } = await supabase
        .from("shows")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows", season] });
    },
  });
}

export function useDuplicateShow(season: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (show: ShowWithImages) => {
      const { id, created_at, updated_at, show_images, seo_keyword, seo_meta_description, seo_slug, seo_title, web_text, ...rest } = show;
      const { data, error } = await supabase
        .from("shows")
        .insert({
          ...rest,
          title: `${show.title} (kopie)`,
          hero_image_url: null,
          hero_image_preview: null,
          season,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows", season] });
    },
  });
}

export function useDeleteShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    },
  });
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadShowImage(file: File, showId: string): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Ongeldig bestandstype: ${file.type}. Alleen JPEG, PNG, WebP en GIF zijn toegestaan.`);
  }
  const ext = file.name.split(".").pop();
  const path = `${showId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("show-assets").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("show-assets").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteShowImage(fileUrl: string) {
  const parts = fileUrl.split("/show-assets/");
  if (parts.length < 2) {
    throw new Error(`Ongeldig bestandspad: kan storage-pad niet herleiden uit URL`);
  }
  const path = parts[1];
  const { error } = await supabase.storage.from("show-assets").remove([path]);
  if (error) throw error;
}

export function useAddSceneImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ showId, fileUrl, fileName }: { showId: string; fileUrl: string; fileName: string }) => {
      const { error } = await supabase
        .from("show_images")
        .insert({ show_id: showId, type: "scene", file_url: fileUrl, file_name: fileName });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    },
  });
}

export function useDeleteSceneImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fileUrl }: { id: string; fileUrl: string }) => {
      // Delete DB record first — if this fails, no orphaned state is created.
      const { error } = await supabase.from("show_images").delete().eq("id", id);
      if (error) throw error;
      // Then clean up storage (best-effort; orphaned files are less harmful than orphaned records).
      try {
        await deleteShowImage(fileUrl);
      } catch (storageErr) {
        console.warn("Storage cleanup failed (orphaned file may remain):", storageErr);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    },
  });
}
