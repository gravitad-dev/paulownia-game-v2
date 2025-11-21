/**
 * Tipos para el sistema de validación de direcciones
 */

export interface AddressData {
  address: string;
  city: string;
  zipcode: string;
  country: string;
  formattedAddress?: string; // Dirección completa formateada
  lat?: number; // Opcional, para futuro uso con mapas
  lon?: number;
}

export interface AddressSuggestion {
  displayName: string;
  address: AddressData;
  placeId: string;
  lat: number;
  lon: number;
}

export interface NominatimPlace {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: string[];
}

export interface AddressValidationResult {
  isValid: boolean;
  message: string;
  suggestion?: AddressSuggestion;
}

