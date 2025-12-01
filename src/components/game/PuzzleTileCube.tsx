import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

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
 */
export function PuzzleTileCube({
  position,
  imageUrl,
  gridSize,
  tileX,
  tileZ,
  scale = 0.9,
}: PuzzleTileCubeProps) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  // Material para la cara superior - igual que el suelo, solo recorta
  const topMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
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
          
          // UV directo - igual que el suelo, solo recorta la porción
          vec2 uv = vec2(
            u_tileX * tileSize + vUv.x * tileSize,
            u_tileZ * tileSize + vUv.y * tileSize
          );
          
          vec4 texColor = texture2D(u_texture, uv);
          gl_FragColor = texColor;
        }
      `,
    });
  }, [texture, gridSize, tileX, tileZ]);

  // Material para el cuerpo del cubo (blanco con borde)
  const bodyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
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
      }),
    []
  );

  return (
    <group position={position} scale={scale}>
      {/* Cara superior - PlaneGeometry horizontal, igual que el suelo */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.501, 0]}
        material={topMaterial}
      >
        <planeGeometry args={[1, 1]} />
      </mesh>
      
      {/* Cuerpo del cubo */}
      <mesh material={bodyMaterial}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
    </group>
  );
}
