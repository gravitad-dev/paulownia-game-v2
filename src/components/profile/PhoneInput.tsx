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
  disabled?: boolean;
  id?: string;
  name?: string;
  error?: string;
  defaultCountry?: CountryCode;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  id,
  name,
  error,
  defaultCountry = "ES",
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
    <div className="grid gap-2">
      <Label htmlFor={id}>Teléfono</Label>
      <div className="relative">
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
            "phone-input-container",
            displayError && "phone-input-error"
          )}
          inputClass={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            displayError && "border-destructive"
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
