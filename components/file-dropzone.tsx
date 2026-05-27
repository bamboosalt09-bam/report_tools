"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  label?: string;
  hint?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function FileDropzone({
  accept,
  multiple = true,
  maxSize,
  files,
  onFilesChange,
  label = "파일을 끌어오거나 클릭하여 업로드",
  hint,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const filesArray = Array.from(newFiles);
      if (filesArray.length === 0) return;
      const filtered = maxSize
        ? filesArray.filter((f) => f.size <= maxSize)
        : filesArray;
      if (filtered.length === 0) return;
      onFilesChange(multiple ? [...files, ...filtered] : filtered.slice(0, 1));
    },
    [files, onFilesChange, multiple, maxSize]
  );

  const addInputFiles = useCallback(
    (input: HTMLInputElement) => {
      const selected = input.files ? Array.from(input.files) : [];
      input.value = "";
      addFiles(selected);
    },
    [addFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleRemove = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:bg-muted/50"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium">{label}</p>
          {hint && (
            <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
          )}
        </div>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          aria-label={label}
          className="mt-2 block w-full max-w-sm cursor-pointer rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
          onChange={(e) => addInputFiles(e.currentTarget)}
          onDrop={(e) => {
            e.stopPropagation();
            if (e.dataTransfer.files.length > 0) {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
            >
              <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(i);
                }}
                aria-label="제거"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
