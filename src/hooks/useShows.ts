import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ShowWithImages } from "@/lib/showStatus";

export function useShows(season: string) {
  return useQuery({
    queryKey: ["shows", season],
    queryFn: async (): Promise<ShowWithImages[]> => {
      const { data, error } = await supabase
        .from("shows")
        .select("*, show_images(type)")
        .eq("season", season)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as ShowWithImages[];
    },
  });
}

export function useCreateShow(season: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (show: { title: string; genre?: string }) => {
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
