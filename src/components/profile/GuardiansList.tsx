'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressForm } from '@/components/address/AddressForm';
import { AddressData } from '@/types/address';
import { PhoneInput } from '@/components/profile/PhoneInput';
import { Trash2, Shield, ChevronDown } from 'lucide-react';
import { useState, useCallback, memo, useMemo } from 'react';
import { useFormContext, Controller, useFieldArray, FieldArrayWithId, useWatch } from 'react-hook-form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ProfileFormData, GuardianFormData } from '@/types/profile';
import { getCountryCode } from '@/lib/countries';
import { CountryCode } from 'libphonenumber-js';

interface GuardiansListProps {
  isMinor: boolean;
  removeGuardian: (index: number) => void;
  disabled?: boolean;
  fields?: FieldArrayWithId<ProfileFormData, 'guardians', 'id'>[];
}

const GuardiansListComponent = function GuardiansList({
  isMinor,
  removeGuardian,
  disabled = false,
  fields: fieldsProp,
}: GuardiansListProps) {
  const { control } = useFormContext<ProfileFormData>();
  
  // Usar fields pasados como prop para evitar problemas de sincronización
  // Si no se pasan, usar useFieldArray como fallback
  const { fields: fieldsFromHook } = useFieldArray({
    control,
    name: 'guardians',
  });
  
  // Preferir fields pasados como prop para evitar problemas de sincronización
  const fields = fieldsProp ?? fieldsFromHook;

  const [expandedGuardians, setExpandedGuardians] = useState<Set<number>>(new Set());

  const toggleGuardian = useCallback((index: number) => {
    setExpandedGuardians((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Memoizar los guardianes con sus datos y callbacks estables para evitar re-renders innecesarios
  // IMPORTANTE: Este hook debe ejecutarse siempre, antes de cualquier return condicional
  const guardiansWithData = useMemo(() => {
    if (!fields || fields.length === 0) {
      return [];
    }
    return fields.map((field, index) => {
      // FieldArrayWithId incluye todos los campos de GuardianFormData directamente junto con el id
      // Accedemos directamente a las propiedades del field
      return {
        id: field.id,
        index,
        name: (field as GuardianFormData).name ?? '',
        lastName: (field as GuardianFormData).lastName ?? '',
        DNI: (field as GuardianFormData).DNI ?? '',
        onToggle: () => toggleGuardian(index),
        onRemove: () => removeGuardian(index),
      };
    });
  }, [fields, toggleGuardian, removeGuardian]);

  // Returns condicionales DESPUÉS de todos los hooks
  if (!isMinor) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-2 py-8">
        <Shield className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground/70 max-w-xs">
          Esta sección solo es necesaria para usuarios menores de 18 años.
        </p>
      </div>
    );
  }

  if (!fields || fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Haz clic en &quot;Añadir&quot; para agregar un guardián.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {guardiansWithData.map((guardianData) => {
        const isExpanded = expandedGuardians.has(guardianData.index);
        const hasBasicInfo = !!(guardianData.name && guardianData.lastName && guardianData.DNI);

        return (
          <GuardianFormItem
            key={guardianData.id}
            index={guardianData.index}
            isExpanded={isExpanded}
            onToggle={guardianData.onToggle}
            onRemove={guardianData.onRemove}
            hasBasicInfo={hasBasicInfo}
            name={guardianData.name}
            lastName={guardianData.lastName}
            DNI={guardianData.DNI}
            disabled={disabled}
          />
        );
      })}
      
    </div>
  );
};

interface GuardianFormItemProps {
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  hasBasicInfo: boolean;
  name?: string;
  lastName?: string;
  DNI?: string;
  disabled: boolean;
}

const GuardianFormItem = memo(function GuardianFormItem({
  index,
  isExpanded,
  onToggle,
  onRemove,
  hasBasicInfo,
  name,
  lastName,
  DNI,
  disabled,
}: GuardianFormItemProps) {
  const formContext = useFormContext<ProfileFormData>();
  const { control, setValue, register } = formContext;
  
  // Watch address fields to ensure they update correctly
  const guardianAddressFields = useWatch({
    control,
    name: `guardians.${index}` as const,
  }) as GuardianFormData | undefined;
  
  // Usar Controller para los campos de dirección sin causar re-renders
  const handleAddressChange = useCallback(
    (addressData: Partial<AddressData> | ((prev: Partial<AddressData>) => Partial<AddressData>)) => {
      // Obtener valores actuales del form usando getValues para evitar dependencias
      const currentValues = formContext.getValues();
      const currentGuardian = currentValues.guardians?.[index] as GuardianFormData | undefined;
      
      // Si es una función, la evaluamos primero
      if (typeof addressData === 'function') {
        const currentAddress: Partial<AddressData> = {
          address: currentGuardian?.address || '',
          city: currentGuardian?.city || '',
          zipcode: currentGuardian?.zipcode || '',
          country: currentGuardian?.country || '',
        };
        addressData = addressData(currentAddress);
      }

      // Actualizar campos individuales en RHF con shouldTouch para asegurar que se actualicen
      if (addressData.address !== undefined) {
        setValue(`guardians.${index}.address`, addressData.address, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      }
      if (addressData.city !== undefined) {
        setValue(`guardians.${index}.city`, addressData.city, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      }
      if (addressData.zipcode !== undefined) {
        setValue(`guardians.${index}.zipcode`, addressData.zipcode, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      }
      if (addressData.country !== undefined) {
        // Asegurar que el país se actualice correctamente
        setValue(`guardians.${index}.country`, addressData.country, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
      }
    },
    [setValue, index, formContext]
  );

  // Usar Controller para obtener y renderizar los campos de dirección
  return (
    <Controller
      control={control}
      name={`guardians.${index}`}
      render={({ field: guardianField }) => {
        // Usar los valores observados con useWatch como fuente de verdad para addressData
        // Esto asegura que los cambios se reflejen inmediatamente
        const guardianValue = (guardianAddressFields || guardianField.value || {}) as GuardianFormData;
        const addressData: Partial<AddressData> = {
          address: guardianValue.address || '',
          city: guardianValue.city || '',
          zipcode: guardianValue.zipcode || '',
          country: guardianValue.country || '',
        };

        return (
          <Collapsible
            open={isExpanded}
            onOpenChange={onToggle}
            className="border border-border/30 rounded-lg"
          >
            <div className="flex items-center justify-between p-3 border-b border-border/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {hasBasicInfo
                    ? `${name} ${lastName}`
                    : `Padre/Tutor #${index + 1}`}
                </p>
                {DNI && (
                  <p className="text-xs text-muted-foreground truncate">
                    DNI: {DNI}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Button
                  type="button"
                  onClick={onRemove}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                  disabled={disabled}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            <CollapsibleContent>
              <div className="p-3 space-y-3">
                {/* Datos básicos */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-xs" htmlFor={`guardian-name-${index}`}>
                      Nombre *
                    </Label>
                    <Input
                      id={`guardian-name-${index}`}
                      {...register(`guardians.${index}.name`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs" htmlFor={`guardian-lastname-${index}`}>
                      Apellido *
                    </Label>
                    <Input
                      id={`guardian-lastname-${index}`}
                      {...register(`guardians.${index}.lastName`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs" htmlFor={`guardian-dni-${index}`}>
                    DNI *
                  </Label>
                  <Input
                    id={`guardian-dni-${index}`}
                    {...register(`guardians.${index}.DNI`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    disabled={disabled}
                    className="text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs" htmlFor={`guardian-email-${index}`}>
                    Email
                  </Label>
                  <Input
                    id={`guardian-email-${index}`}
                    type="email"
                    {...register(`guardians.${index}.email`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    disabled={disabled}
                    className="text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs" htmlFor={`guardian-phone-${index}`}>
                    Teléfono
                  </Label>
                  <Controller
                    control={control}
                    name={`guardians.${index}.phone`}
                    render={({ field }) => (
                      <PhoneInput
                        id={`guardian-phone-${index}`}
                        name={`guardian-phone-${index}`}
                        value={field.value || ''}
                        onChange={(value) => {
                          field.onChange(value);
                          // Asegurar que se marque como touched y dirty
                          setValue(`guardians.${index}.phone`, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                        }}
                        disabled={disabled}
                        defaultCountry={addressData.country ? (getCountryCode(addressData.country) as CountryCode | undefined) : undefined}
                      />
                    )}
                  />
                </div>

                {/* Dirección completa con el nuevo AddressForm */}
                <div className="pt-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground mb-3">Dirección del tutor</p>
                  <AddressForm
                    value={addressData}
                    onChange={handleAddressChange}
                    disabled={disabled}
                    showManualEntry={true}
                    idPrefix={`guardian-${index}`}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      }}
    />
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para el memo - comparar todas las props relevantes
  return (
    prevProps.index === nextProps.index &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.hasBasicInfo === nextProps.hasBasicInfo &&
    prevProps.name === nextProps.name &&
    prevProps.lastName === nextProps.lastName &&
    prevProps.DNI === nextProps.DNI &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onRemove === nextProps.onRemove
  );
});

// Memoizar el componente para evitar re-renders innecesarios
export const GuardiansList = memo(GuardiansListComponent);
