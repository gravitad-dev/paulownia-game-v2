"use client";

import { useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Cargar textura porous.jpg
const loader = new THREE.TextureLoader();
const porousTexture = loader.load("/textures/porous.jpg");

// Geometría compartida
const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

// Interfaz para colores de bloque
interface BlockColors {
  topBottom: string;
  frontBack: string;
  leftRight: string;
}

// Interfaz para parámetros de variante de cubo
export interface CubeVariantParams {
  colors: BlockColors;
  patternFactor: number;
  patternScale: number;
  patternPositionRandomness: number;
  patternFaceConfig: "V" | "H" | "VH";
  thickness: number;
  scale: number;
}

// Parámetros para el cubo blanco activo (pieza que cae)
export const ACTIVE_CUBE_PARAMS: CubeVariantParams = {
  colors: {
    topBottom: "#ffffff",
    frontBack: "#ffffff",
    leftRight: "#ffffff",
  },
  patternFactor: -1.0,
  patternScale: 0.32,
  patternPositionRandomness: 0.14,
  patternFaceConfig: "VH",
  thickness: 0.02,
  scale: 0.9,
};

// Shader material con textura real
const createNoisyCubeMaterial = (params: CubeVariantParams) => {
  const randomOffset = new THREE.Vector2(
    Math.random() * params.patternPositionRandomness,
    Math.random() * params.patternPositionRandomness
  );

  return new THREE.ShaderMaterial({
    uniforms: {
      u_texture: { value: porousTexture },
      u_color_top_bottom: { value: new THREE.Color(params.colors.topBottom) },
      u_color_front_back: { value: new THREE.Color(params.colors.frontBack) },
      u_color_left_right: { value: new THREE.Color(params.colors.leftRight) },
      u_pattern_scale: { value: params.patternScale },
      u_pattern_factor: { value: params.patternFactor },
      u_pattern_face_h: {
        value: params.patternFaceConfig.includes("H") ? 1.0 : 0.0,
      },
      u_pattern_face_v: {
        value: params.patternFaceConfig.includes("V") ? 1.0 : 0.0,
      },
      u_random_offset: { value: randomOffset },
      u_time: { value: 1.0 },
      u_thickness: { value: params.thickness },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D u_texture;
      uniform float u_thickness;
      uniform float u_time;
      varying vec2 vUv;
      varying vec3 vNormal;
      uniform vec3 u_color_top_bottom;
      uniform vec3 u_color_left_right;
      uniform vec3 u_color_front_back;
      uniform float u_pattern_factor;
      uniform float u_pattern_scale;
      uniform float u_pattern_face_h;
      uniform float u_pattern_face_v;
      uniform vec2 u_random_offset;

      vec4 LinearTosRGB(vec4 value) {
        vec3 lt = vec3(lessThanEqual(value.rgb, vec3(0.0031308)));
        vec3 v1 = value.rgb * 12.92;
        vec3 v2 = pow(value.rgb, vec3(0.41666)) * 1.055 - vec3(0.055);
        return vec4(mix(v2, v1, lt), value.a);
      }

      void main() {
        float uvScale = u_pattern_scale;
        vec2 scaledUV = vUv * uvScale + u_random_offset;
        vec4 texColor = texture2D(u_texture, scaledUV);
        float thickness = u_thickness;
        vec3 color;

        float mixFactor = texColor.r;

        if (vNormal.x > 0.9) color = u_color_left_right;
        else if (vNormal.x < -0.9) color = u_color_left_right;
        else if (vNormal.y > 0.9) color = u_color_top_bottom;
        else if (vNormal.y < -0.9) color = u_color_top_bottom;
        else if (vNormal.z > 0.9) color = u_color_front_back;
        else if (vNormal.z < -0.9) color = u_color_front_back;
        else color = vec3(1.0, 1.0, 1.0);

        if (u_pattern_face_h == 1.0) {
          if (vNormal.x > 0.9 || vNormal.x < -0.9 || vNormal.z > 0.9 || vNormal.z < -0.9) {
            color = mix(color + u_pattern_factor, color, mixFactor);
          }
        }

        if (u_pattern_face_v == 1.0) {
          if (vNormal.y > 0.9 || vNormal.y < -0.9 || vNormal.z > 0.9 || vNormal.z < -0.9) {
            color = mix(color + u_pattern_factor, color, mixFactor);
          }
        }

        if (vUv.y < thickness || vUv.y > 1.0 - thickness || vUv.x < thickness || vUv.x > 1.0 - thickness) {
          gl_FragColor = vec4(0.03, 0.03, 0.03, 1.0);
        } else {
          gl_FragColor = LinearTosRGB(vec4(color, 1.0));
        }
      }
    `,
    transparent: true,
  });
};

// Cache de materiales
const materialCache = new Map<string, THREE.ShaderMaterial>();

function getMaterialCacheKey(params: CubeVariantParams): string {
  return `${params.colors.topBottom}-${params.colors.frontBack}-${params.colors.leftRight}-${params.patternFactor}-${params.patternScale}-${params.patternFaceConfig}-${params.thickness}-${params.scale}`;
}

function getCachedMaterial(params: CubeVariantParams): THREE.ShaderMaterial {
  const key = getMaterialCacheKey(params);
  if (!materialCache.has(key)) {
    materialCache.set(key, createNoisyCubeMaterial(params));
  }
  return materialCache.get(key)!;
}

interface ActiveCubeProps {
  position: [number, number, number];
  variantParams?: CubeVariantParams;
}

/**
 * Cubo activo (pieza que está cayendo) - cubo blanco con bordes y textura de ruido.
 * Usa el mismo shader que los bloques del juego principal.
 */
export const ActiveCube = memo(function ActiveCube({
  position,
  variantParams = ACTIVE_CUBE_PARAMS,
}: ActiveCubeProps) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // OPTIMIZACIÓN: Usar material cacheado
  if (!materialRef.current) {
    materialRef.current = getCachedMaterial(variantParams);
  }

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value =
        state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={variantParams.scale}
      geometry={SHARED_BOX_GEOMETRY}
    >
      <primitive object={materialRef.current} attach="material" />
    </mesh>
  );
});

