import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  season: string;
  onPrevSeason: () => void;
  onNextSeason: () => void;
}

export function AppHeader({ season, onPrevSeason, onNextSeason }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-lg">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-card-foreground">ShowReady</h1>
            <p className="text-xs text-muted-foreground">Stadstheater Zoetermeer</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onPrevSeason} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[60px] text-center font-semibold text-card-foreground">{season}</span>
          <Button variant="ghost" size="icon" onClick={onNextSeason} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
