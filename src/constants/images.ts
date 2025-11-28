/**
 * Constantes de imágenes de la aplicación
 * Centraliza todas las URLs de imágenes fallback/placeholder
 */

/**
 * Imágenes de fallback para diferentes contextos
 * Almacenadas localmente en /public/images/fallbacks/
 */
export const FALLBACK_IMAGES = {
  /**
   * Fallback para premios/rewards (confetti/celebración)
   */
  reward: "/images/fallbacks/reward.jpg",

  /**
   * Fallback para premios en catálogo (versión más pequeña)
   */
  rewardSmall: "/images/fallbacks/reward-small.jpg",

  /**
   * Fallback para avatares de usuario
   */
  avatar: "/images/fallbacks/avatar.jpg",

  /**
   * Fallback para niveles
   */
  level: "/images/fallbacks/level.jpg",

  /**
   * Fallback para logros/achievements
   */
  achievement: "/images/fallbacks/achievement.jpg",
} as const;

/**
 * Tipo para las claves de imágenes fallback
 */
export type FallbackImageKey = keyof typeof FALLBACK_IMAGES;
