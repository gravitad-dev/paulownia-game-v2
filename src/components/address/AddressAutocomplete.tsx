"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchAddress } from "@/services/nominatim.service";
import { AddressSuggestion } from "@/types/address";
import { Loader2, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string, suggestion?: AddressSuggestion) => void;
  onSuggestionSelect?: (suggestion: AddressSuggestion) => void;
  disabled?: boolean;
  countryCode?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  showManualEntry?: boolean;
}

export function AddressAutocomplete({
  id,
  name,
  label = "Dirección",
  value,
  onChange,
  onSuggestionSelect,
  disabled = false,
  countryCode,
  placeholder = "Buscar dirección...",
  required = false,
  error,
  showManualEntry = true,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = useCallback(
    async (query: string) => {
      if (query.length < 3 || manualMode) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const results = await searchAddress(query, countryCode, 5);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error("Error searching address:", error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    },
    [countryCode, manualMode],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Cancelar búsqueda anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce de 500ms para búsqueda automática
    if (!manualMode && newValue.length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(newValue);
      }, 500);
    } else if (newValue.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.address.address, suggestion);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const toggleManualMode = () => {
    setManualMode(!manualMode);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div className="grid gap-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {showManualEntry && (
            <button
              type="button"
              onClick={toggleManualMode}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              disabled={disabled}
            >
              {manualMode ? "Activar autocompletado" : "Entrada manual"}
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            name={name}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (!manualMode && value.length >= 3 && suggestions.length > 0) {
                setShowDropdown(true);
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
            className={cn("pr-10", error && "border-destructive")}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : manualMode ? (
              <Search className="h-4 w-4" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* Dropdown de sugerencias */}
        {showDropdown && !manualMode && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.placeId}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm transition-colors",
                  "hover:bg-muted focus:bg-muted focus:outline-none",
                  highlightedIndex === index && "bg-muted",
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {suggestion.address.address}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {suggestion.address.city &&
                        `${suggestion.address.city}, `}
                      {suggestion.address.country}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!manualMode && value.length > 0 && value.length < 3 && !error && (
        <p className="text-xs text-muted-foreground">
          Introduce al menos 3 caracteres para buscar
        </p>
      )}
    </div>
  );
}
