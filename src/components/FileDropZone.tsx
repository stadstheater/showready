import { useState, useCallback, type ReactNode } from "react";
import { Upload, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFilesDropped: (files: File[]) => void;
  accept?: string;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".txt", ".docx"];

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const ext = file.name.toLowerCase().split(".").pop();
  return ACCEPTED_EXTENSIONS.some((e) => e === `.${ext}`);
}

export function FileDropZone({
  onFilesDropped,
  children,
  className,
  disabled,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setDragCounter((c) => c + 1);
      setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter((c) => {
        const next = c - 1;
        if (next <= 0) {
          setIsDragging(false);
          return 0;
        }
        return next;
      });
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCounter(0);
      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files).filter(isAcceptedFile);
      if (droppedFiles.length > 0) {
        onFilesDropped(droppedFiles);
      }
    },
    [disabled, onFilesDropped]
  );

  return (
    <div
      className={cn("relative", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="flex items-center gap-2 text-primary">
            <Upload className="h-8 w-8 animate-bounce" />
          </div>
          <p className="text-sm font-medium text-primary">
            Sleep bestanden hierheen
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" /> JPG, PNG, WebP
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> TXT, DOCX
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
