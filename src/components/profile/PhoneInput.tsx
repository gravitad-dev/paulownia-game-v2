"use client";

import { useState, useMemo, useEffect } from "react";
import PhoneInputLib from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Label } from "@/components/ui/label";
import { validatePhoneNumber } from "@/lib/validators";
import { cn } from "@/lib/utils";
import { parsePhoneNumber, CountryCode } from "libphonenumber-js";

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  /** Callback cuando el usuario cambia el país en el selector de teléfono */
  onCountryChange?: (countryCode: CountryCode) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  error?: string;
  defaultCountry?: CountryCode;
  /** Si es true, no muestra la label interna (útil cuando ya hay una label externa) */
  compact?: boolean;
  /** Altura del input: true = h-9, false = h-10 (default) */
  small?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  onCountryChange,
  disabled = false,
  id,
  name,
  error,
  defaultCountry = "ES",
  compact = false,
  small = false,
}: PhoneInputProps) {
  // Solo parsear cuando cambie el value y usar useMemo para evitar re-cálculos innecesarios
  const detectedCountry = useMemo(() => {
    if (value) {
      try {
        const parsed = parsePhoneNumber(value);
        if (parsed?.country) {
          return parsed.country;
        }
      } catch {
        // Ignorar errores de parsing
      }
    }
    return defaultCountry;
  }, [value, defaultCountry]);

  const [selectedCountry, setSelectedCountry] =
    useState<CountryCode>(detectedCountry);
  const [validationError, setValidationError] = useState("");

  // Solo actualizar el país cuando realmente cambie el detectado
  useEffect(() => {
    if (detectedCountry !== selectedCountry) {
      setSelectedCountry(detectedCountry);
    }
  }, [detectedCountry, selectedCountry]);

  const handleChange = (phone: string, country: { countryCode: string }) => {
    // react-phone-input-2 ya incluye el código de país en el formato +XX XXXXXXX
    onChange(phone);
    setValidationError("");

    // Actualizar el país seleccionado solo si cambió
    if (country?.countryCode) {
      const newCountry = country.countryCode.toUpperCase() as CountryCode;
      if (newCountry !== selectedCountry) {
        setSelectedCountry(newCountry);
        // Notificar al componente padre del cambio de país
        onCountryChange?.(newCountry);
      }
    }
  };

  const handleBlurInternal = () => {
    const currentValue = value || "";

    if (onBlur && currentValue) {
      onBlur(currentValue);
    }

    // Validar el número
    if (currentValue) {
      const validation = validatePhoneNumber(currentValue, selectedCountry);
      if (!validation.isValid) {
        setValidationError(validation.message);
      } else {
        setValidationError("");
      }
    }
  };

  const displayError = error || validationError;

  return (
    <div className={cn("grid min-w-0", compact ? "gap-0" : "gap-2")}>
      {!compact && <Label htmlFor={id}>Teléfono</Label>}
      <div className="relative min-w-0">
        <PhoneInputLib
          country={selectedCountry.toLowerCase() as string}
          value={value || ""}
          onChange={handleChange}
          onBlur={handleBlurInternal}
          disabled={disabled}
          inputProps={{
            id,
            name,
            required: false,
          }}
          containerClass={cn(
            "phone-input-container w-full",
            displayError && "phone-input-error",
            small && "phone-input-small",
          )}
          inputClass={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            small ? "h-9" : "h-10",
            displayError && "border-destructive",
          )}
          buttonClass="phone-input-button"
          dropdownClass="phone-input-dropdown z-50"
        />
      </div>
      {displayError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}
    </div>
  );
}
