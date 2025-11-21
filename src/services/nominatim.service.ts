/**
 * Servicio de geocoding usando Nominatim (OpenStreetMap API)
 * API gratuita con rate limit de 1 req/segundo
 * https://nominatim.openstreetmap.org/
 */

import { AddressData, AddressSuggestion, NominatimPlace, AddressValidationResult } from '@/types/address';

const NOMINATIM_ENDPOINT = process.env.NEXT_PUBLIC_NOMINATIM_ENDPOINT || 'https://nominatim.openstreetmap.org';
const RATE_LIMIT_MS = Number(process.env.NEXT_PUBLIC_NOMINATIM_RATE_LIMIT) || 1000;

// Cache para reducir llamadas repetidas
const searchCache = new Map<string, AddressSuggestion[]>();
const validationCache = new Map<string, AddressValidationResult>();

// Control de rate limiting
let lastRequestTime = 0;

/**
 * Espera el tiempo necesario para cumplir con el rate limit
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Construye la dirección completa de un resultado de Nominatim
 */
function buildFullAddress(place: NominatimPlace): string {
  const parts: string[] = [];
  
  if (place.address.house_number) parts.push(place.address.house_number);
  if (place.address.road) parts.push(place.address.road);
  
  return parts.join(' ') || place.display_name.split(',')[0];
}

/**
 * Extrae los componentes de dirección de un resultado de Nominatim
 */
function extractAddressData(place: NominatimPlace): AddressData {
  const city = place.address.city 
    || place.address.town 
    || place.address.village 
    || place.address.municipality
    || place.address.county
    || '';
  
  return {
    address: buildFullAddress(place),
    city,
    zipcode: place.address.postcode || '',
    country: place.address.country || '',
    formattedAddress: place.display_name,
    lat: parseFloat(place.lat),
    lon: parseFloat(place.lon),
  };
}

/**
 * Busca direcciones con autocompletado
 * @param query - Texto de búsqueda
 * @param countryCode - Código ISO del país (opcional, ej: 'es', 'us')
 * @param limit - Número máximo de resultados (default: 5)
 */
export async function searchAddress(
  query: string,
  countryCode?: string,
  limit: number = 5
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  // Verificar cache
  const cacheKey = `${query.toLowerCase()}-${countryCode || 'all'}-${limit}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  try {
    await waitForRateLimit();

    const params = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      addressdetails: '1',
      limit: limit.toString(),
      'accept-language': 'es',
    });

    if (countryCode) {
      params.append('countrycodes', countryCode.toLowerCase());
    }

    const response = await fetch(
      `${NOMINATIM_ENDPOINT}/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'PaulowniaGame/1.0 (Contact: admin@paulowniagame.com)',
        },
      }
    );

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText);
      return [];
    }

    const data: NominatimPlace[] = await response.json();

    const suggestions: AddressSuggestion[] = data.map(place => ({
      displayName: place.display_name,
      address: extractAddressData(place),
      placeId: place.place_id.toString(),
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
    }));

    // Guardar en cache
    searchCache.set(cacheKey, suggestions);

    return suggestions;
  } catch (error) {
    console.error('Error searching address:', error);
    return [];
  }
}

/**
 * Valida una dirección completa
 * @param addressData - Datos de la dirección a validar
 */
export async function validateFullAddress(
  addressData: Partial<AddressData>
): Promise<AddressValidationResult> {
  const { address, city, zipcode, country } = addressData;

  // Validaciones básicas
  if (!country || country.trim() === '') {
    return {
      isValid: false,
      message: 'El país es obligatorio.',
    };
  }

  if (!address || address.trim() === '') {
    return {
      isValid: true,
      message: '', // Dirección es opcional
    };
  }

  // Construir query de búsqueda
  const queryParts: string[] = [];
  if (address) queryParts.push(address.trim());
  if (city) queryParts.push(city.trim());
  if (zipcode) queryParts.push(zipcode.trim());
  if (country) queryParts.push(country.trim());

  const query = queryParts.join(', ');

  // Verificar cache
  const cacheKey = `validate-${query.toLowerCase()}`;
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey)!;
  }

  try {
    const suggestions = await searchAddress(query, undefined, 1);

    if (suggestions.length === 0) {
      const result: AddressValidationResult = {
        isValid: false,
        message: 'No se encontró la dirección. Por favor, verifica los datos.',
      };
      validationCache.set(cacheKey, result);
      return result;
    }

    const firstSuggestion = suggestions[0];
    const suggestedAddress = firstSuggestion.address;

    // Verificar coincidencias
    const cityMatch = !city || 
      suggestedAddress.city.toLowerCase().includes(city.toLowerCase()) ||
      city.toLowerCase().includes(suggestedAddress.city.toLowerCase());

    const countryMatch = !country || 
      suggestedAddress.country.toLowerCase().includes(country.toLowerCase()) ||
      country.toLowerCase().includes(suggestedAddress.country.toLowerCase());

    if (!cityMatch || !countryMatch) {
      const result: AddressValidationResult = {
        isValid: false,
        message: 'La dirección no coincide con la ciudad o país especificado.',
        suggestion: firstSuggestion,
      };
      validationCache.set(cacheKey, result);
      return result;
    }

    const result: AddressValidationResult = {
      isValid: true,
      message: '',
      suggestion: firstSuggestion,
    };
    validationCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error validating address:', error);
    return {
      isValid: false,
      message: 'Error al validar la dirección. Por favor, inténtalo de nuevo.',
    };
  }
}

/**
 * Valida que una ciudad existe en un país
 * @param city - Nombre de la ciudad
 * @param country - Nombre del país
 */
export async function validateCityInCountry(
  city: string | null | undefined,
  country: string | null | undefined
): Promise<{ isValid: boolean; message: string }> {
  if (!city || city.trim() === '') {
    return { isValid: true, message: '' }; // Campo opcional
  }

  if (!country || country.trim() === '') {
    return { isValid: true, message: '' }; // No se puede validar sin país
  }

  try {
    const query = `${city.trim()}, ${country.trim()}`;
    const suggestions = await searchAddress(query, undefined, 1);

    if (suggestions.length === 0) {
      return {
        isValid: false,
        message: `La ciudad "${city}" no se encontró en ${country}.`,
      };
    }

    const suggestedAddress = suggestions[0].address;
    
    // Verificar que el país coincide
    if (!suggestedAddress.country.toLowerCase().includes(country.toLowerCase())) {
      return {
        isValid: false,
        message: `La ciudad "${city}" no existe en ${country}.`,
      };
    }

    return { isValid: true, message: '' };
  } catch (error) {
    console.error('Error validating city:', error);
    return {
      isValid: false,
      message: 'Error al validar la ciudad. Por favor, inténtalo de nuevo.',
    };
  }
}

/**
 * Valida que un código postal corresponde a una ciudad
 * @param zipcode - Código postal
 * @param city - Ciudad
 * @param country - País
 */
export async function validateZipCodeInCity(
  zipcode: string | null | undefined,
  city: string | null | undefined,
  country: string | null | undefined
): Promise<{ isValid: boolean; message: string }> {
  if (!zipcode || zipcode.trim() === '') {
    return { isValid: true, message: '' }; // Campo opcional
  }

  if (!city || city.trim() === '') {
    return {
      isValid: false,
      message: 'Por favor, introduce una ciudad para validar el código postal.',
    };
  }

  try {
    const query = `${zipcode.trim()}, ${city.trim()}${country ? ', ' + country.trim() : ''}`;
    const suggestions = await searchAddress(query, undefined, 1);

    if (suggestions.length === 0) {
      return {
        isValid: false,
        message: `El código postal ${zipcode} no se encontró para la ciudad ${city}.`,
      };
    }

    const suggestedAddress = suggestions[0].address;

    // Verificar que el código postal coincide (puede ser parcial)
    if (suggestedAddress.zipcode && 
        !suggestedAddress.zipcode.includes(zipcode.trim()) &&
        !zipcode.trim().includes(suggestedAddress.zipcode)) {
      return {
        isValid: false,
        message: `El código postal ${zipcode} no corresponde a la ciudad ${city}.`,
      };
    }

    return { isValid: true, message: '' };
  } catch (error) {
    console.error('Error validating zipcode:', error);
    return {
      isValid: false,
      message: 'Error al validar el código postal. Por favor, inténtalo de nuevo.',
    };
  }
}

/**
 * Limpia el cache (útil para testing o si se necesita refrescar)
 */
export function clearCache(): void {
  searchCache.clear();
  validationCache.clear();
}

