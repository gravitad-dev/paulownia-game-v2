# Componentes de Validación de Direcciones

Esta carpeta contiene los componentes profesionales para validación de direcciones utilizando Nominatim API.

## Componentes

### AddressAutocomplete

Input con autocompletado de direcciones en tiempo real.

**Uso básico:**
```tsx
<AddressAutocomplete
  value={address}
  onChange={(value, suggestion) => {
    setAddress(value);
    if (suggestion) {
      // Auto-rellena otros campos
      setCity(suggestion.address.city);
      setZipcode(suggestion.address.zipcode);
    }
  }}
  countryCode="ES"
  placeholder="Buscar dirección..."
/>
```

**Props:**
- `value: string` - Valor actual del input
- `onChange: (value: string, suggestion?: AddressSuggestion) => void` - Callback al cambiar
- `onSuggestionSelect?: (suggestion: AddressSuggestion) => void` - Al seleccionar sugerencia
- `countryCode?: string` - Código ISO del país para filtrar (ej: 'ES', 'US')
- `disabled?: boolean` - Deshabilitar input
- `showManualEntry?: boolean` - Mostrar opción de entrada manual
- `error?: string` - Mensaje de error a mostrar

### AddressForm

Formulario completo de dirección con validación en cascada.

**Uso básico:**
```tsx
const [addressData, setAddressData] = useState<Partial<AddressData>>({
  address: '',
  city: '',
  zipcode: '',
  country: '',
});

<AddressForm
  value={addressData}
  onChange={setAddressData}
  disabled={false}
  required={true}
  showManualEntry={true}
  idPrefix="user"
/>
```

**Props:**
- `value: Partial<AddressData>` - Datos de la dirección
- `onChange: (data: Partial<AddressData>) => void` - Callback al cambiar
- `disabled?: boolean` - Deshabilitar todo el formulario
- `required?: boolean` - Marcar campos como requeridos
- `showManualEntry?: boolean` - Permitir entrada manual en autocompletado
- `idPrefix?: string` - Prefijo para IDs (útil con múltiples instancias)

## Tipos

```typescript
interface AddressData {
  address: string;
  city: string;
  zipcode: string;
  country: string;
  formattedAddress?: string;
  lat?: number;
  lon?: number;
}

interface AddressSuggestion {
  displayName: string;
  address: AddressData;
  placeId: string;
  lat: number;
  lon: number;
}
```

## Características

- ✅ Autocompletado en tiempo real
- ✅ Validación en cascada
- ✅ Indicadores visuales de estado
- ✅ Navegación con teclado
- ✅ Rate limiting automático
- ✅ Cache de resultados
- ✅ Responsive
- ✅ Accesible (ARIA)

## Dependencias

- `@/services/nominatim.service.ts` - Servicio de geocoding
- `@/types/address.ts` - Tipos TypeScript
- `@/components/ui/*` - Componentes base de shadcn/ui

