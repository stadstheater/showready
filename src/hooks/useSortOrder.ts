import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Persists a sort order per context key in the settings table.
 * Falls back to the default order when no saved order exists.
 *
 * @param contextKey - A unique key like "website-sections" or "scene-photos-{showId}"
 * @param defaultIds - The default order of item IDs
 */
export function useSortOrder(contextKey: string, defaultIds: string[]) {
  const [orderedIds, setOrderedIds] = useState<string[]>(defaultIds);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load saved order
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await supabase
          .from("settings")
          .select("value")
          .eq("key", `sort_order_${contextKey}`)
          .maybeSingle();

        if (!cancelled && data?.value) {
          const saved = (data.value as any) as string[];
          if (Array.isArray(saved)) {
            // Merge: use saved order, append any new items not in saved
            const merged = [
              ...saved.filter((id) => defaultIds.includes(id)),
              ...defaultIds.filter((id) => !saved.includes(id)),
            ];
            setOrderedIds(merged);
          }
        }
      } catch {
        // Use default order
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [contextKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // When defaultIds change (e.g. items added/removed), reconcile
  useEffect(() => {
    if (!loaded) return;
    setOrderedIds((prev) => {
      const merged = [
        ...prev.filter((id) => defaultIds.includes(id)),
        ...defaultIds.filter((id) => !prev.includes(id)),
      ];
      return merged;
    });
  }, [defaultIds.join(","), loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateOrder = useCallback(
    (newIds: string[]) => {
      setOrderedIds(newIds);

      // Debounced save
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await supabase.from("settings").upsert(
            { key: `sort_order_${contextKey}`, value: newIds as any },
            { onConflict: "key" }
          );
        } catch (e) {
          console.warn("Failed to save sort order:", e);
        }
      }, 500);
    },
    [contextKey]
  );

  return { orderedIds, updateOrder, loaded };
}
