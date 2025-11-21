/**
 * Servicio para validación de direcciones usando Google Maps Geocoding API
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface GeocodeResult {
  address: string;
  city?: string;
  zipcode?: string;
  country?: string;
  isValid: boolean;
  formattedAddress?: string;
}

/**
 * Valida si una dirección existe en Google Maps
 * @param address - Dirección a validar
 * @param city - Ciudad opcional
 * @param zipcode - Código postal opcional
 * @param country - País opcional
 * @returns Resultado de la validación
 */
export async function validateAddressExists(
  address: string | null | undefined,
  city?: string | null,
  zipcode?: string | null,
  country?: string | null
): Promise<{ isValid: boolean; message: string; result?: GeocodeResult }> {
  if (!address || address.trim() === '') {
    return { isValid: true, message: '' }; // Campo opcional
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API Key no configurada. La validación de direcciones no funcionará.');
    return { isValid: true, message: '' }; // Permitir si no hay API key configurada
  }

  try {
    // Construir query de búsqueda
    let query = address.trim();
    
    if (city) {
      query += `, ${city}`;
    }
    
    if (zipcode) {
      query += `, ${zipcode}`;
    }
    
    if (country) {
      query += `, ${country}`;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&language=es`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components || [];

      // Extraer componentes de la dirección
      const extractedCity = extractComponent(addressComponents, ['locality', 'administrative_area_level_2']);
      const extractedZipcode = extractComponent(addressComponents, ['postal_code']);
      const extractedCountry = extractComponent(addressComponents, ['country']);

      return {
        isValid: true,
        message: '',
        result: {
          address: result.formatted_address || address,
          city: extractedCity,
          zipcode: extractedZipcode,
          country: extractedCountry,
          isValid: true,
          formattedAddress: result.formatted_address,
        },
      };
    } else if (data.status === 'ZERO_RESULTS') {
      return {
        isValid: false,
        message: 'La dirección no se encontró en Google Maps. Por favor, verifica la dirección.',
      };
    } else {
      return {
        isValid: false,
        message: 'Error al validar la dirección. Por favor, inténtalo de nuevo.',
      };
    }
  } catch (error) {
    console.error('Error validando dirección:', error);
    return {
      isValid: false,
      message: 'Error al validar la dirección. Por favor, inténtalo de nuevo.',
    };
  }
}

/**
 * Valida que una ciudad existe en un país específico
 * @param city - Ciudad a validar
 * @param country - País donde debe existir la ciudad
 * @returns Resultado de la validación
 */
export async function validateCityInCountry(
  city: string | null | undefined,
  country?: string | null
): Promise<{ isValid: boolean; message: string }> {
  if (!city || city.trim() === '') {
    return { isValid: true, message: '' }; // Campo opcional
  }

  if (!country || !GOOGLE_MAPS_API_KEY) {
    return { isValid: true, message: '' }; // Sin validación si no hay país o API key
  }

  try {
    const query = `${city.trim()}, ${country.trim()}`;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&language=es`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components || [];
      const extractedCountry = extractComponent(addressComponents, ['country']);

      // Verificar que el país coincide
      if (extractedCountry?.toLowerCase() === country.toLowerCase()) {
        return { isValid: true, message: '' };
      } else {
        return {
          isValid: false,
          message: `La ciudad "${city}" no existe en ${country}.`,
        };
      }
    } else {
      return {
        isValid: false,
        message: `La ciudad "${city}" no se encontró en ${country}.`,
      };
    }
  } catch (error) {
    console.error('Error validando ciudad:', error);
    return {
      isValid: false,
      message: 'Error al validar la ciudad. Por favor, inténtalo de nuevo.',
    };
  }
}

/**
 * Valida que un código postal corresponde a una ciudad específica
 * @param zipcode - Código postal a validar
 * @param city - Ciudad donde debe estar el código postal
 * @param country - País opcional
 * @returns Resultado de la validación
 */
export async function validateZipCodeInCity(
  zipcode: string | null | undefined,
  city?: string | null,
  country?: string | null
): Promise<{ isValid: boolean; message: string }> {
  if (!zipcode || zipcode.trim() === '') {
    return { isValid: true, message: '' }; // Campo opcional
  }

  if (!city || !GOOGLE_MAPS_API_KEY) {
    return { isValid: true, message: '' }; // Sin validación si no hay ciudad o API key
  }

  try {
    let query = `${zipcode.trim()}`;
    
    if (city) {
      query += `, ${city.trim()}`;
    }
    
    if (country) {
      query += `, ${country.trim()}`;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&language=es`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components || [];
      
      const extractedZipcode = extractComponent(addressComponents, ['postal_code']);
      const extractedCity = extractComponent(addressComponents, ['locality', 'administrative_area_level_2']);

      // Verificar que el código postal y ciudad coinciden
      if (extractedZipcode === zipcode.trim() && extractedCity?.toLowerCase() === city.toLowerCase()) {
        return { isValid: true, message: '' };
      } else {
        return {
          isValid: false,
          message: `El código postal ${zipcode} no corresponde a la ciudad ${city}.`,
        };
      }
    } else {
      return {
        isValid: false,
        message: `El código postal ${zipcode} no se encontró para la ciudad ${city}.`,
      };
    }
  } catch (error) {
    console.error('Error validando código postal:', error);
    return {
      isValid: false,
      message: 'Error al validar el código postal. Por favor, inténtalo de nuevo.',
    };
  }
}

/**
 * Extrae un componente específico de los address_components de Google Maps
 */
function extractComponent(
  components: Array<{ types: string[]; long_name: string; short_name: string }>,
  types: string[]
): string | undefined {
  const component = components.find((comp) =>
    types.some((type) => comp.types.includes(type))
  );
  return component?.long_name || component?.short_name;
}

