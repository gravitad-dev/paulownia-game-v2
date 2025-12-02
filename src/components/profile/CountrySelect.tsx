"use client";

import { memo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  error?: string;
  loading?: boolean;
  /** Si es true, no muestra la label interna */
  compact?: boolean;
  /** Altura del input: true = h-9, false = h-10 (default) */
  small?: boolean;
}

function CountrySelectComponent({
  value,
  onChange,
  disabled = false,
  id,
  name,
  error,
  loading = false,
  compact = false,
  small = false,
}: CountrySelectProps) {
  return (
    <div className={cn("grid", compact ? "gap-0" : "gap-2")}>
      {!compact && <Label htmlFor={id}>País</Label>}
      <div className="relative">
        <Select
          value={value || ""}
          onValueChange={onChange}
          disabled={disabled || loading}
        >
          <SelectTrigger
            id={id}
            name={name}
            aria-invalid={error ? "true" : "false"}
            className={cn(small && "h-9", error && "border-destructive")}
          >
            <SelectValue placeholder="Selecciona un país" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.name}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Memoizar el componente para evitar re-renders innecesarios
export const CountrySelect = memo(
  CountrySelectComponent,
  (prevProps, nextProps) => {
    // Comparar props relevantes
    return (
      prevProps.value === nextProps.value &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.id === nextProps.id &&
      prevProps.name === nextProps.name &&
      prevProps.error === nextProps.error &&
      prevProps.loading === nextProps.loading &&
      prevProps.compact === nextProps.compact &&
      prevProps.small === nextProps.small &&
      prevProps.onChange === nextProps.onChange
    );
  },
);
