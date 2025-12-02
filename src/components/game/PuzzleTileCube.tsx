import { useLoader } from "@react-three/fiber";
import { useMemo, memo } from "react";
import * as THREE from "three";

// ============================================================================
// OPTIMIZACIÓN: Geometrías compartidas
// Evita crear nuevas geometrías para cada cubo de puzzle
// ============================================================================
const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const SHARED_PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1);

// ============================================================================
// OPTIMIZACIÓN: Cache global de materiales por (gridSize, tileX, tileZ)
// Evita crear nuevos ShaderMaterials cuando los parámetros son idénticos
// ============================================================================
const tileMaterialCache = new Map<string, THREE.ShaderMaterial>();
const bodyMaterialCache = new Map<string, THREE.ShaderMaterial>();

function getCachedTileMaterial(
  texture: THREE.Texture,
  gridSize: number,
  tileX: number,
  tileZ: number
): THREE.ShaderMaterial {
  const key = `${gridSize}-${tileX}-${tileZ}`;
  let material = tileMaterialCache.get(key);
  
  if (!material) {
    material = new THREE.ShaderMaterial({
      uniforms: {
        u_texture: { value: texture },
        u_gridSize: { value: gridSize },
        u_tileX: { value: tileX },
        u_tileZ: { value: tileZ },
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
        uniform float u_gridSize;
        uniform float u_tileX;
        uniform float u_tileZ;
        varying vec2 vUv;
        
        void main() {
          float tileSize = 1.0 / u_gridSize;
          
          // Invertir tileZ para corregir orientación de imagen
          // En OpenGL/Three.js: V=0 es ABAJO, V=1 es ARRIBA
          // Pero tileZ=0 es la fila SUPERIOR de la imagen
          // Por eso invertimos: invertedZ = gridSize - 1 - tileZ
          float invertedZ = u_gridSize - 1.0 - u_tileZ;
          
          vec2 uv = vec2(
            u_tileX * tileSize + vUv.x * tileSize,
            invertedZ * tileSize + vUv.y * tileSize
          );
          
          vec4 texColor = texture2D(u_texture, uv);
          gl_FragColor = texColor;
        }
      `,
    });
    tileMaterialCache.set(key, material);
  } else {
    // Actualizar la textura si cambió (misma key pero diferente textura)
    material.uniforms.u_texture.value = texture;
  }
  
  return material;
}

function getCachedBodyMaterial(): THREE.ShaderMaterial {
  const key = "body-material";
  if (!bodyMaterialCache.has(key)) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_thickness: { value: 0.02 },
        u_color: { value: new THREE.Color("#ffffff") },
        u_border_color: { value: new THREE.Color("#333333") },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float u_thickness;
        uniform vec3 u_color;
        uniform vec3 u_border_color;
        void main() {
          float thickness = u_thickness;
          if (vUv.y < thickness || vUv.y > 1.0 - thickness || 
              vUv.x < thickness || vUv.x > 1.0 - thickness) {
            gl_FragColor = vec4(u_border_color, 1.0);
          } else {
            gl_FragColor = vec4(u_color, 1.0);
          }
        }
      `,
    });
    bodyMaterialCache.set(key, material);
  }
  return bodyMaterialCache.get(key)!;
}

interface PuzzleTileCubeProps {
  position: [number, number, number];
  imageUrl: string;
  gridSize: number;
  tileX: number;
  tileZ: number;
  scale?: number;
}

/**
 * Renderiza un cubo con el tile correspondiente de la imagen del puzzle.
 * 
 * SIMPLE: Misma lógica que el suelo, solo recorta la porción correspondiente.
 * - PlaneGeometry rotado -90° en X (igual que PuzzleFloor)
 * - UV directo, solo recorta la región del tile
 * 
 * OPTIMIZACIÓN: Memoizado y usa cache de materiales
 */
export const PuzzleTileCube = memo(function PuzzleTileCube({
  position,
  imageUrl,
  gridSize,
  tileX,
  tileZ,
  scale = 0.9,
}: PuzzleTileCubeProps) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  // OPTIMIZACIÓN: Usar materiales cacheados en lugar de crear nuevos
  const topMaterial = useMemo(() => {
    return getCachedTileMaterial(texture, gridSize, tileX, tileZ);
  }, [texture, gridSize, tileX, tileZ]);

  const bodyMaterial = useMemo(() => {
    return getCachedBodyMaterial();
  }, []);

  return (
    <group position={position} scale={scale}>
      {/* Cara superior - PlaneGeometry horizontal, igual que el suelo */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.501, 0]}
        material={topMaterial}
        geometry={SHARED_PLANE_GEOMETRY}
      />
      
      {/* Cuerpo del cubo */}
      <mesh material={bodyMaterial} geometry={SHARED_BOX_GEOMETRY} />
    </group>
  );
});
