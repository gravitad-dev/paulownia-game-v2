"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  LegalDocumentContent,
  getLegalDocumentMeta,
  type LegalDocumentType,
} from "./LegalDocumentContent";

interface LegalDocumentDialogProps {
  type: LegalDocumentType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LegalDocumentDialog({
  type,
  open,
  onOpenChange,
}: LegalDocumentDialogProps) {
  const meta = type ? getLegalDocumentMeta(type) : null;
  const Icon = meta?.icon;
  const today = new Date().toLocaleDateString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {type && meta && Icon ? (
        <DialogContent
          className={cn(
            "max-w-3xl w-full p-0 gap-0 overflow-hidden",
            "max-h-[80vh]",
          )}
        >
          <div className="flex flex-col">
            <DialogHeader className="gap-1 border-b border-border/40 bg-muted/40 px-6 py-4">
              <div className="flex items-center gap-2 text-primary">
                <Icon className="h-5 w-5" />
                <DialogTitle className="text-lg font-semibold text-foreground">
                  {meta.title}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Última actualización: {today}
              </DialogDescription>
            </DialogHeader>
            <div
              className="px-6 py-4 overflow-y-auto"
              style={{ maxHeight: "calc(80vh - 120px)" }}
            >
              <LegalDocumentContent type={type} />
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
