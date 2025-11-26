const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

/**
 * Construye la URL completa de una imagen de Strapi.
 * Si la URL ya es absoluta (empieza con http), la devuelve tal cual.
 * Si es relativa, la concatena con la URL base de la API.
 */
export function getStrapiImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}
