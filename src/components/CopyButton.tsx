import { useState } from "react";
import { Check, Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
}

export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0",
        className,
      )}
      title="Kopieer naar klembord"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-status-done" />
      ) : (
        <Clipboard className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
