"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import { AddressData, AddressSuggestion } from "@/types/address";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { CountrySelect } from "@/components/profile/CountrySelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  validateCityInCountry,
  validateZipCodeInCity,
} from "@/services/nominatim.service";
import { getCountryCode } from "@/lib/countries";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressFormProps {
  value: Partial<AddressData>;
  onChange: (
    data:
      | Partial<AddressData>
      | ((prev: Partial<AddressData>) => Partial<AddressData>),
  ) => void;
  disabled?: boolean;
  required?: boolean;
  showManualEntry?: boolean;
  idPrefix?: string; // Para evitar colisiones de IDs cuando hay múltiples instancias
}

function AddressFormComponent({
  value,
  onChange,
  disabled = false,
  required = false,
  showManualEntry = true,
  idPrefix = "address",
}: AddressFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [validated, setValidated] = useState<Record<string, boolean>>({});

  // Refs para cancelar validaciones (mantenidos para cleanup al desmontar)
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup al desmontar
  useEffect(() => {
    // Copiar referencias a variables locales para el cleanup
    const timers = debounceTimersRef.current;
    const controllers = abortControllersRef.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      controllers.forEach((controller) => controller.abort());
    };
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof AddressData, newValue: string) => {
      // Usar función de actualización para evitar dependencia de value
      onChange((prev) => {
        if (typeof prev === "function") return prev;
        return { ...prev, [field]: newValue };
      });

      // Limpiar estado de validación al cambiar
      setErrors((prev) => ({ ...prev, [field]: "" }));
      setValidated((prev) => ({ ...prev, [field]: false }));
    },
    [onChange],
  );

  // Usar ref para acceder a value sin causar re-renders
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleCountryChange = useCallback(
    async (countryName: string) => {
      handleFieldChange("country", countryName);
      setErrors((prev) => ({ ...prev, country: "" }));
      setValidated((prev) => ({ ...prev, country: true }));

      // No validar automáticamente - solo al hacer blur
    },
    [handleFieldChange],
  );

  const handleAddressSuggestionSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      // Auto-rellenar todos los campos con la sugerencia
      onChange((prev) => {
        if (typeof prev === "function") return prev;
        return {
          address: suggestion.address.address,
          city: suggestion.address.city,
          zipcode: suggestion.address.zipcode,
          country: suggestion.address.country || prev.country,
          formattedAddress: suggestion.displayName,
          lat: suggestion.lat,
          lon: suggestion.lon,
        };
      });

      // Marcar todos los campos como validados
      setValidated({
        address: true,
        city: true,
        zipcode: true,
        country: true,
      });
      setErrors({});
    },
    [onChange],
  );

  const handleCityBlur = useCallback(async () => {
    const currentValue = valueRef.current;
    if (disabled || !currentValue.city || !currentValue.country) return;

    // Validar inmediatamente al blur (sin debounce)
    setLoading((prev) => ({ ...prev, city: true }));
    try {
      const result = await validateCityInCountry(
        currentValue.city,
        currentValue.country,
      );
      setErrors((prev) => ({
        ...prev,
        city: result.isValid ? "" : result.message,
      }));
      setValidated((prev) => ({ ...prev, city: result.isValid }));
    } catch (error) {
      console.error("Error validating city:", error);
    } finally {
      setLoading((prev) => ({ ...prev, city: false }));
    }
  }, [disabled]);

  const handleZipcodeBlur = useCallback(async () => {
    const currentValue = valueRef.current;
    if (disabled || !currentValue.zipcode) return;

    if (!currentValue.city) {
      setErrors((prev) => ({
        ...prev,
        zipcode: "Por favor, introduce primero la ciudad.",
      }));
      return;
    }

    // Validar inmediatamente al blur (sin debounce)
    setLoading((prev) => ({ ...prev, zipcode: true }));
    try {
      const result = await validateZipCodeInCity(
        currentValue.zipcode,
        currentValue.city,
        currentValue.country,
      );
      setErrors((prev) => ({
        ...prev,
        zipcode: result.isValid ? "" : result.message,
      }));
      setValidated((prev) => ({ ...prev, zipcode: result.isValid }));
    } catch (error) {
      console.error("Error validating zipcode:", error);
    } finally {
      setLoading((prev) => ({ ...prev, zipcode: false }));
    }
  }, [disabled]);

  const renderValidationIcon = (field: string) => {
    if (loading[field]) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (validated[field]) {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    if (errors[field]) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* País - siempre primero */}
      <div className="relative">
        <CountrySelect
          id={`${idPrefix}-country`}
          name="country"
          value={value.country}
          onChange={handleCountryChange}
          disabled={disabled}
          error={errors.country}
          loading={loading.country}
        />
        {!loading.country && validated.country && (
          <div className="absolute right-3 top-9 pointer-events-none">
            {renderValidationIcon("country")}
          </div>
        )}
      </div>

      {/* Dirección con autocompletado */}
      <div className="relative">
        <AddressAutocomplete
          id={`${idPrefix}-address`}
          name="address"
          label="Dirección"
          value={value.address || ""}
          onChange={(newValue) => handleFieldChange("address", newValue)}
          onSuggestionSelect={handleAddressSuggestionSelect}
          disabled={disabled || !value.country}
          countryCode={
            value.country ? getCountryCode(value.country) : undefined
          }
          placeholder={
            value.country ? "Calle y número..." : "Selecciona primero un país"
          }
          required={required}
          error={errors.address}
          showManualEntry={showManualEntry}
        />
      </div>

      {/* Ciudad y Código Postal en la misma fila */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-city`}>
            Ciudad
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="relative">
            <Input
              id={`${idPrefix}-city`}
              name="city"
              value={value.city || ""}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              onBlur={handleCityBlur}
              disabled={disabled || !value.country}
              placeholder={value.country ? "Ciudad..." : "Selecciona país"}
              className={cn("pr-10", errors.city && "border-destructive")}
              aria-invalid={errors.city ? "true" : "false"}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {renderValidationIcon("city")}
            </div>
          </div>
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-zipcode`}>Código Postal</Label>
          <div className="relative">
            <Input
              id={`${idPrefix}-zipcode`}
              name="zipcode"
              value={value.zipcode || ""}
              onChange={(e) => handleFieldChange("zipcode", e.target.value)}
              onBlur={handleZipcodeBlur}
              disabled={disabled || !value.city}
              placeholder={value.city ? "Código postal..." : "Introduce ciudad"}
              className={cn("pr-10", errors.zipcode && "border-destructive")}
              aria-invalid={errors.zipcode ? "true" : "false"}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {renderValidationIcon("zipcode")}
            </div>
          </div>
          {errors.zipcode && (
            <p className="text-sm text-destructive">{errors.zipcode}</p>
          )}
        </div>
      </div>

      {/* Dirección formateada como confirmación */}
      {value.formattedAddress && validated.address && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
            <div>
              <p className="font-medium text-xs text-muted-foreground mb-1">
                Dirección confirmada:
              </p>
              <p className="text-foreground">{value.formattedAddress}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoizar el componente para evitar re-renders innecesarios
export const AddressForm = memo(
  AddressFormComponent,
  (prevProps, nextProps) => {
    // Comparar props relevantes
    return (
      prevProps.disabled === nextProps.disabled &&
      prevProps.required === nextProps.required &&
      prevProps.showManualEntry === nextProps.showManualEntry &&
      prevProps.idPrefix === nextProps.idPrefix &&
      prevProps.onChange === nextProps.onChange &&
      JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value)
    );
  },
);
