'use client';

import { useCallback } from 'react';
import { User } from '@/types/user';
import { PhoneInput } from '@/components/profile/PhoneInput';
import { AddressForm } from '@/components/address/AddressForm';
import { AddressData } from '@/types/address';
import { getCountryCode } from '@/lib/countries';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { CountryCode } from 'libphonenumber-js';

export function ContactDataForm({ disabled = false }: { disabled?: boolean }) {
  const { control, setValue } = useFormContext<User>();
  
  // Watch address fields to pass to AddressForm
  const addressValues = useWatch({
    control,
    name: ['address', 'city', 'zipcode', 'country'],
  });
  
  const [address, city, zipcode, country] = addressValues;

  const handleAddressChange = useCallback(
    (addressData: Partial<AddressData> | ((prev: Partial<AddressData>) => Partial<AddressData>)) => {
      // Si es una función, la evaluamos primero
      if (typeof addressData === 'function') {
        const currentAddress: Partial<AddressData> = {
          address: address || '',
          city: city || '',
          zipcode: zipcode || '',
          country: country || '',
        };
        addressData = addressData(currentAddress);
      }

      // Actualizar campos individuales en RHF
      if (addressData.address !== undefined) {
        setValue('address', addressData.address, { shouldDirty: true, shouldValidate: true });
      }
      if (addressData.city !== undefined) {
        setValue('city', addressData.city, { shouldDirty: true, shouldValidate: true });
      }
      if (addressData.zipcode !== undefined) {
        setValue('zipcode', addressData.zipcode, { shouldDirty: true, shouldValidate: true });
      }
      if (addressData.country !== undefined) {
        setValue('country', addressData.country, { shouldDirty: true, shouldValidate: true });
      }
    },
    [setValue, address, city, zipcode, country]
  );

  const addressData: Partial<AddressData> = {
    address: address || '',
    city: city || '',
    zipcode: zipcode || '',
    country: country || '',
  };

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Información de contacto</p>
        <h3 className="text-lg font-medium">Contacto y Ubicación</h3>
      </div>

      <div className="grid gap-4">
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              id="phone"
              name="phone"
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
              defaultCountry={(country ? (getCountryCode(country) as CountryCode | undefined) : undefined) || 'ES'}
            />
          )}
        />
        
        <AddressForm
          value={addressData}
          onChange={handleAddressChange}
          disabled={disabled}
          showManualEntry={true}
          idPrefix="user"
        />
      </div>
    </section>
  );
}
