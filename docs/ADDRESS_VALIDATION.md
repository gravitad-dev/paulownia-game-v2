# Sistema de Validación de Direcciones

## Descripción General

Este sistema proporciona validación profesional de direcciones utilizando Nominatim (OpenStreetMap API), una API gratuita y de código abierto. El sistema está diseñado para garantizar que las direcciones ingresadas sean válidas y verificables, crítico para una plataforma que maneja premios de alto valor.

## Componentes Principales

### 1. Servicio de Geocoding (`nominatim.service.ts`)

El servicio principal que interactúa con la API de Nominatim.

**Características:**
- Rate limiting automático (1 req/segundo)
- Cache local para reducir llamadas a la API
- Búsqueda de direcciones con autocompletado
- Validación de direcciones completas
- Validación de ciudades por país
- Validación de códigos postales

**Funciones principales:**
```typescript
searchAddress(query, countryCode?, limit?): Promise<AddressSuggestion[]>
validateFullAddress(addressData): Promise<AddressValidationResult>
validateCityInCountry(city, country): Promise<{isValid, message}>
validateZipCodeInCity(zipcode, city, country): Promise<{isValid, message}>
```

### 2. AddressAutocomplete Component

Componente de input con autocompletado de direcciones.

**Características:**
- Autocompletado en tiempo real
- Debounce de 500ms
- Navegación con teclado (↑ ↓ Enter Esc)
- Modo manual opcional
- Indicadores de carga
- Soporte para filtrado por país

**Props:**
```typescript
{
  value: string;
  onChange: (value: string, suggestion?: AddressSuggestion) => void;
  onSuggestionSelect?: (suggestion: AddressSuggestion) => void;
  countryCode?: string;
  disabled?: boolean;
  showManualEntry?: boolean;
}
```

### 3. AddressForm Component

Componente completo de formulario de dirección estilo Amazon.

**Características:**
- Validación en cascada (País → Ciudad → CP → Dirección)
- Auto-relleno al seleccionar sugerencia
- Indicadores visuales de validación (✓ ✗ ⚠)
- Confirmación de dirección formateada
- Deshabilita campos dependientes hasta completar prerequisitos

**Props:**
```typescript
{
  value: Partial<AddressData>;
  onChange: (data: Partial<AddressData>) => void;
  disabled?: boolean;
  required?: boolean;
  showManualEntry?: boolean;
  idPrefix?: string;
}
```

## Uso

### En ContactDataForm (Perfil de Usuario)

```typescript
import { AddressForm } from '@/components/address/AddressForm';
import { AddressData } from '@/types/address';

const addressData: Partial<AddressData> = {
  address: formData.address || '',
  city: formData.city || '',
  zipcode: formData.zipcode || '',
  country: formData.country || '',
};

<AddressForm
  value={addressData}
  onChange={handleAddressChange}
  disabled={disabled}
  showManualEntry={true}
  idPrefix="user"
/>
```

### En GuardiansList (Tutores)

```typescript
<AddressForm
  value={{
    address: guardian.address || '',
    city: guardian.city || '',
    zipcode: guardian.zipcode || '',
    country: guardian.country || '',
  }}
  onChange={(addressData) => handleGuardianAddressChange(index, addressData)}
  disabled={disabled}
  showManualEntry={true}
  idPrefix={`guardian-${index}`}
/>
```

## API de Nominatim

### Endpoint
```
https://nominatim.openstreetmap.org
```

### Rate Limiting
- **Límite:** 1 solicitud por segundo
- **Implementación:** Automática en el servicio
- **Cache:** Implementado para reducir llamadas repetidas

### Política de Uso Justo
Según las políticas de Nominatim:
1. ✅ Máximo 1 req/segundo (implementado)
2. ✅ User-Agent personalizado (implementado)
3. ✅ No abuso del servicio
4. ✅ Cache de resultados

### Limitaciones
- Gratuito pero limitado a 1 req/seg
- Precisión variable según región
- No garantiza 100% de cobertura global
- Algunos códigos postales pueden no estar disponibles

## Variables de Entorno

```env
# Opcional - endpoint personalizado
NEXT_PUBLIC_NOMINATIM_ENDPOINT=https://nominatim.openstreetmap.org

# Opcional - ajustar rate limit (en milisegundos)
NEXT_PUBLIC_NOMINATIM_RATE_LIMIT=1000
```

## Validación en Cascada

El sistema valida los campos en orden:

1. **País** (obligatorio)
   - Debe seleccionarse primero
   - Habilita los demás campos

2. **Dirección** (opcional)
   - Autocompletado basado en país
   - Validación con ciudad y CP si están disponibles

3. **Ciudad** (opcional)
   - Validada contra el país seleccionado
   - Requerida para validar código postal

4. **Código Postal** (opcional)
   - Requiere ciudad para validación
   - Validado contra ciudad y país

## Indicadores Visuales

- **🔄 Loader:** Validación en progreso
- **✓ Check verde:** Campo validado correctamente
- **✗ Cruz roja:** Error de validación
- **⚠ Advertencia:** Campo requiere atención

## Manejo de Errores

El sistema maneja varios tipos de errores:

1. **Dirección no encontrada**
   - Mensaje: "No se encontró la dirección"
   - Sugerencia: Verificar datos

2. **Ciudad no existe en país**
   - Mensaje: "La ciudad no existe en [País]"
   - Sugerencia: Verificar nombre de ciudad

3. **CP no corresponde a ciudad**
   - Mensaje: "El código postal no corresponde a la ciudad"
   - Sugerencia: Verificar CP

4. **Error de red**
   - Mensaje: "Error al validar. Inténtalo de nuevo"
   - Sugerencia: Reintentar

## Testing Manual

### Flujo Completo de Usuario

1. Ir a `/game/profile`
2. Hacer clic en "Editar"
3. En Contacto y Ubicación:
   - Seleccionar país (ej: España)
   - Escribir dirección: "Calle Mayor"
   - Seleccionar de las sugerencias
   - Verificar auto-relleno de ciudad y CP
4. Guardar cambios
5. Verificar que los datos se guardan correctamente

### Testing de Guardians

1. Ser menor de 18 años
2. Hacer clic en "Añadir" padre
3. Llenar datos básicos
4. Expandir el collapsible
5. Completar dirección con autocompletado
6. Verificar validación
7. Guardar

### Casos de Prueba

#### ✅ Caso 1: Dirección válida con autocompletado
- País: España
- Dirección: "Gran Via"
- Resultado: Varias sugerencias, seleccionar una
- Esperado: Auto-rellena ciudad y CP

#### ✅ Caso 2: Entrada manual
- Activar "Entrada manual"
- Completar campos manualmente
- Resultado: Validación al perder foco
- Esperado: Validación correcta

#### ✅ Caso 3: Ciudad no válida
- País: España
- Ciudad: "Ciudad Inventada XYZ"
- Resultado: Error de validación
- Esperado: Mensaje descriptivo

#### ✅ Caso 4: CP no corresponde
- Ciudad: Madrid
- CP: 08001 (Barcelona)
- Resultado: Error de validación
- Esperado: "El CP no corresponde a la ciudad"

## Performance

### Optimizaciones Implementadas

1. **Debouncing:** 500ms antes de cada búsqueda
2. **Cache:** Resultados almacenados en Map
3. **Abort Controllers:** Cancelación de peticiones obsoletas
4. **Rate Limiting:** Respeta límite de 1 req/seg
5. **Memoización:** useCallback en callbacks costosos

### Métricas Esperadas

- Tiempo de respuesta: 200-800ms (según red)
- Reducción de llamadas: ~70% gracias al cache
- UX fluida sin bloqueos

## Migración desde Google Maps

El sistema anterior usaba Google Maps Geocoding API. Los cambios principales:

### Antes (Google Maps)
```typescript
// Requería API key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Llamadas directas sin rate limiting
fetch(`https://maps.googleapis.com/maps/api/geocode/json?...`)
```

### Ahora (Nominatim)
```typescript
// Sin API key necesaria
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';

// Rate limiting automático
await waitForRateLimit();
fetch(`${NOMINATIM_ENDPOINT}/search?...`)
```

### Ventajas de Nominatim

✅ **Gratuito** - Sin costos
✅ **Sin API key** - Más simple
✅ **Open Source** - Transparente
✅ **Privacidad** - No tracking de Google
✅ **Suficiente** - Para nuestras necesidades

### Desventajas Relativas

⚠️ **Rate limit más estricto** - 1 req/seg vs ~50 req/seg
⚠️ **Menos preciso en algunas regiones** - Especialmente rural
⚠️ **Sin garantías SLA** - Servicio comunitario

## Soporte

Para problemas o mejoras:
1. Verificar logs del navegador
2. Verificar logs del servidor Next.js
3. Revisar documentación de Nominatim
4. Considerar alternativas si es necesario

## Futuras Mejoras

- [ ] Integrar mapas interactivos
- [ ] Soporte para coordenadas GPS
- [ ] Validación de existencia de edificio
- [ ] Integración con servicios de correo
- [ ] Cache persistente (localStorage/Redis)
- [ ] Fallback a otros proveedores
- [ ] Verificación con imagen de Google Street View

