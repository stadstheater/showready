import { Lock, BookOpen } from "lucide-react";

export function BrochureTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/30">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border/60 shadow-sm">
          <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
        </div>
      </div>
      <h2 className="text-xl font-bold font-serif text-foreground tracking-tight">Binnenkort beschikbaar</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        De brochure-module is nog in ontwikkeling. Hier kun je straks brochure-content voorbereiden.
      </p>
    </div>
  );
}
