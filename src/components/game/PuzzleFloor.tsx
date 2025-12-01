import { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

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
 */
export function PuzzleFloor({
  imageUrl,
  size,
  position,
}: PuzzleFloorProps) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  useMemo(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }, [texture]);

  // Shader que mezcla la imagen con blanco para mayor contraste
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
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
  }, [texture]);

  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
    >
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}
