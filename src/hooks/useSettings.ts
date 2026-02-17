import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SettingValue = string | number | boolean | string[] | null;
export type SettingsMap = Record<string, SettingValue>;

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<SettingsMap> => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      const map: SettingsMap = {};
      for (const row of data || []) {
        map[row.key] = row.value;
      }
      return map;
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: SettingValue }) => {
      const { error } = await supabase
        .from("settings")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
