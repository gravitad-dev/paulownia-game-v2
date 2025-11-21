import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js'

/**
 * Valida un número de teléfono internacional
 * Detecta automáticamente el país si no se especifica y valida código de país y número
 * @param phoneNumber - Número de teléfono a validar
 * @param country - Código de país opcional (ej: 'ES', 'US')
 * @returns Objeto con isValid y message
 */
export function validatePhoneNumber(
  phoneNumber: string | null | undefined,
  country?: CountryCode
): { isValid: boolean; message: string } {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { isValid: true, message: '' } // Campo opcional
  }

  const trimmedPhone = phoneNumber.trim()

  try {
    // Intentar parsear el número
    const phoneNumberParsed = parsePhoneNumber(trimmedPhone, country || undefined)

    if (!phoneNumberParsed) {
      return {
        isValid: false,
        message: 'Número de teléfono inválido. Verifica el código de país y el número.',
      }
    }

    // Validar que el número es válido
    if (!phoneNumberParsed.isValid()) {
      const detectedCountry = phoneNumberParsed.country
      
      return {
        isValid: false,
        message: `Número de teléfono inválido para ${detectedCountry || 'el país especificado'}. Verifica el formato del número.`,
      }
    }

    // Verificar que el código de país es válido
    const detectedCountry = phoneNumberParsed.country
    if (country && detectedCountry && detectedCountry !== country) {
      return {
        isValid: false,
        message: `El código de país no coincide. El número parece ser de ${detectedCountry} pero se esperaba ${country}.`,
      }
    }

    // Si no se especificó país pero el número tiene uno, validar que es válido
    if (!country && detectedCountry) {
      const isValid = isValidPhoneNumber(trimmedPhone)
      if (!isValid) {
        return {
          isValid: false,
          message: `Número de teléfono inválido para ${detectedCountry}. Verifica el formato del número.`,
        }
      }
    }

    return { isValid: true, message: '' }
  } catch (error) {
    // Si falla el parseo, puede ser formato incorrecto
    if (error instanceof Error) {
      if (error.message.includes('INVALID_COUNTRY')) {
        return {
          isValid: false,
          message: 'Código de país inválido. Usa el formato internacional con código de país (ej: +34 para España).',
        }
      }
      if (error.message.includes('TOO_SHORT')) {
        return {
          isValid: false,
          message: 'Número de teléfono demasiado corto. Verifica que incluyas el código de país y el número completo.',
        }
      }
      if (error.message.includes('TOO_LONG')) {
        return {
          isValid: false,
          message: 'Número de teléfono demasiado largo. Verifica que el número sea correcto.',
        }
      }
    }
    
    return {
      isValid: false,
      message: 'Número de teléfono inválido. Usa el formato internacional con código de país (ej: +34612345678).',
    }
  }
}

/**
 * Formatea un número de teléfono según el formato internacional
 * @param phoneNumber - Número de teléfono a formatear
 * @param country - Código de país opcional
 * @returns Número formateado o el original si no se puede formatear
 */
export function formatPhoneNumber(
  phoneNumber: string,
  country?: CountryCode
): string {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return phoneNumber
  }

  try {
    const phone = parsePhoneNumber(phoneNumber, country)
    return phone.formatInternational()
  } catch {
    return phoneNumber
  }
}

/**
 * Valida una dirección (solo formato básico, la validación real se hace con Google Maps)
 * @param address - Dirección a validar
 * @returns Objeto con isValid y message
 */
export function validateAddress(
  address: string | null | undefined
): { isValid: boolean; message: string } {
  if (!address || address.trim() === '') {
    return { isValid: true, message: '' } // Campo opcional
  }

  // No hacer validaciones básicas de formato - la validación real se hace con Google Maps API
  return { isValid: true, message: '' }
}

/**
 * Valida una ciudad (solo formato básico, la validación real se hace con Google Maps)
 * @param city - Ciudad a validar
 * @returns Objeto con isValid y message
 */
export function validateCity(
  city: string | null | undefined
): { isValid: boolean; message: string } {
  if (!city || city.trim() === '') {
    return { isValid: true, message: '' } // Campo opcional
  }

  // No hacer validaciones básicas de formato - la validación real se hace con Google Maps API
  return { isValid: true, message: '' }
}

/**
 * Valida un código postal (solo formato básico, la validación real se hace con Google Maps)
 * @param zipcode - Código postal a validar
 * @returns Objeto con isValid y message
 */
export function validateZipCode(
  zipcode: string | null | undefined
): { isValid: boolean; message: string } {
  if (!zipcode || zipcode.trim() === '') {
    return { isValid: true, message: '' } // Campo opcional
  }

  // No hacer validaciones básicas de formato - la validación real se hace con Google Maps API
  return { isValid: true, message: '' }
}

/**
 * Valida un país (solo formato básico, la validación real se hace con Google Maps)
 * @param country - País a validar
 * @returns Objeto con isValid y message
 */
export function validateCountry(
  country: string | null | undefined
): { isValid: boolean; message: string } {
  if (!country || country.trim() === '') {
    return { isValid: true, message: '' } // Campo opcional
  }

  // No hacer validaciones básicas de formato - la validación real se hace con Google Maps API
  return { isValid: true, message: '' }
}

