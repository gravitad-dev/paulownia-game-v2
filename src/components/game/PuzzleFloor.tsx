import { useMemo, memo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

// ============================================================================
// OPTIMIZACIÓN: Cache de geometrías por tamaño
// Evita crear nuevas geometrías para cada render
// ============================================================================
const geometryCache = new Map<number, THREE.PlaneGeometry>();

function getCachedPlaneGeometry(size: number): THREE.PlaneGeometry {
  if (!geometryCache.has(size)) {
    geometryCache.set(size, new THREE.PlaneGeometry(size, size));
  }
  return geometryCache.get(size)!;
}

// ============================================================================
// OPTIMIZACIÓN: Cache de materiales del suelo por imageUrl
// Evita crear nuevos ShaderMaterials cuando la textura es la misma
// ============================================================================
const floorMaterialCache = new Map<string, THREE.ShaderMaterial>();

function getCachedFloorMaterial(
  texture: THREE.Texture,
  imageUrl: string
): THREE.ShaderMaterial {
  if (!floorMaterialCache.has(imageUrl)) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_texture: { value: texture },
        u_whiteBlend: { value: 0.5 }, // 50% de mezcla con blanco
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D u_texture;
        uniform float u_whiteBlend;
        varying vec2 vUv;
        
        void main() {
          vec4 texColor = texture2D(u_texture, vUv);
          // Mezclar con blanco para hacer la imagen más clara
          vec3 lightenedColor = mix(texColor.rgb, vec3(1.0), u_whiteBlend);
          gl_FragColor = vec4(lightenedColor, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
    floorMaterialCache.set(imageUrl, material);
  } else {
    // Actualizar textura si el material ya existe pero con textura diferente
    const existingMaterial = floorMaterialCache.get(imageUrl)!;
    existingMaterial.uniforms.u_texture.value = texture;
  }
  return floorMaterialCache.get(imageUrl)!;
}

interface PuzzleFloorProps {
  imageUrl: string;
  size: number;
  gridSize: number;
  position: [number, number, number];
}

/**
 * Renderiza el suelo del puzzle con la imagen completa.
 * 
 * Sistema de coordenadas:
 * - Grid: (0,0) a (gridSize-1, gridSize-1)
 * - Celda (0,0) está en worldX = -halfSize + 0.5, worldZ = -halfSize + 0.5
 * - Esta celda muestra la porción UV (0,0) a (1/gridSize, 1/gridSize) de la imagen
 * 
 * El plano rotado -90° en X tiene:
 * - U aumentando con +X del mundo
 * - V aumentando con +Z del mundo
 * 
 * Esto coincide con las coordenadas del grid, así que no se necesita inversión.
 * 
 * OPTIMIZACIÓN: Memoizado y usa cache de geometrías/materiales
 */
export const PuzzleFloor = memo(function PuzzleFloor({
  imageUrl,
  size,
  position,
}: PuzzleFloorProps) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  // Configurar textura (solo cuando cambia)
  useMemo(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }, [texture]);

  // OPTIMIZACIÓN: Usar geometría cacheada
  const geometry = useMemo(() => getCachedPlaneGeometry(size), [size]);

  // OPTIMIZACIÓN: Usar material cacheado
  const material = useMemo(
    () => getCachedFloorMaterial(texture, imageUrl),
    [texture, imageUrl]
  );

  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
      geometry={geometry}
    />
  );
});
