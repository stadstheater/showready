import { Lock } from "lucide-react";

export function BrochureTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">Binnenkort beschikbaar</h2>
      <p className="mt-2 text-muted-foreground">De brochure-module is nog in ontwikkeling</p>
    </div>
  );
}
