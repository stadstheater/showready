import { Globe } from "lucide-react";

export function WebsiteTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Globe className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">Website beheer</h2>
      <p className="mt-2 text-muted-foreground">Beheer hier de website-content van je voorstellingen</p>
    </div>
  );
}
