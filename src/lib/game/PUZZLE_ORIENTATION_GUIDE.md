# Guía de Orientación del Sistema de Puzzle

## Resumen Ejecutivo

Este documento explica cómo funciona el sistema de coordenadas y orientaciones en el puzzle 3D de Tetris. Es **CRUCIAL** entender estos conceptos antes de modificar cualquier código relacionado con tiles, piezas de puzzle, o renderizado.

---

## 1. Sistema de Coordenadas

### 1.1 Espacio 3D de Three.js

```
        Y (arriba)
        |
        |
        |_______ X (derecha)
       /
      /
     Z (hacia la cámara)
```

- **X**: Eje horizontal (izquierda → derecha)
- **Y**: Eje vertical (abajo → arriba)
- **Z**: Eje de profundidad (lejos → cerca de la cámara)

### 1.2 Grid del Puzzle (Vista desde arriba)

```
     Z- (lejos de cámara)
        ↑
        |
   ┌────┼────────────────────┐
   │    |   row=0 (techo)    │
   │    |   row=1            │
X- ←────┼────────────────────→ X+
   │    |   row=4            │
   │    |   row=5 (base)     │
   └────┼────────────────────┘
        |
        ↓
     Z+ (cerca de cámara)
```

### 1.3 Mapeo de Coordenadas

| Imagen Original | Grid de Tiles | Espacio 3D |
|-----------------|---------------|------------|
| `column` (0-5)  | `tile.column` | `X` |
| `row` (0-5)     | `tile.row`    | `Z` (INVERTIDO) |

**IMPORTANTE:** El mapeo de `row` a `Z` está **INVERTIDO**:
- `row = 0` (techo de imagen) → `Z = gridSize - 1` (Z alto, cerca de cámara)
- `row = 5` (base de imagen) → `Z = 0` (Z bajo, lejos de cámara)

Fórmula:
```typescript
gridPosition.z = gridSize - 1 - row
row = gridSize - 1 - gridPosition.z
```

---

## 2. Sistema de Orientación de Tiles

### 2.1 Orientación Base [1, 2, 3, 4]

Cada tile tiene 4 esquinas numeradas en sentido horario:

```
┌─────────┐
│ 1     2 │  ← Parte SUPERIOR de la imagen
│         │
│ 4     3 │  ← Parte INFERIOR de la imagen
└─────────┘
```

La orientación `[1, 2, 3, 4]` significa:
- Esquina superior izquierda = 1
- Esquina superior derecha = 2
- Esquina inferior derecha = 3
- Esquina inferior izquierda = 4

Esta es la orientación **BASE** (sin rotar, imagen hacia abajo ⬇️).

### 2.2 Rotaciones

Si el tile se rota 90° en sentido horario:

```
Rotación 0° [1,2,3,4]:    Rotación 90° [4,1,2,3]:
┌─────────┐               ┌─────────┐
│ 1     2 │               │ 4     1 │
│         │               │         │
│ 4     3 │               │ 3     2 │
└─────────┘               └─────────┘

Rotación 180° [3,4,1,2]:  Rotación 270° [2,3,4,1]:
┌─────────┐               ┌─────────┐
│ 3     4 │               │ 2     3 │
│         │               │         │
│ 2     1 │               │ 1     4 │
└─────────┘               └─────────┘
```

### 2.3 Regla CRUCIAL

**TODOS los tiles del puzzle DEBEN tener orientación `[1, 2, 3, 4]`.**

Si algún tile tiene una orientación diferente, la imagen no se verá correctamente. El sistema valida esto automáticamente y muestra errores en consola si detecta tiles con orientación incorrecta.

---

## 3. Sistema de Coordenadas UV (Texturas)

### 3.1 Convención OpenGL/Three.js

```
V = 1.0 ┌─────────────────┐
        │ Parte SUPERIOR  │
        │ de la imagen    │
        │                 │
        │ Parte INFERIOR  │
V = 0.0 └─────────────────┘
        U=0.0           U=1.0
```

**IMPORTANTE:** En OpenGL/Three.js:
- `V = 0` es la parte **INFERIOR** de la imagen
- `V = 1` es la parte **SUPERIOR** de la imagen

### 3.2 Cálculo de UV para Tiles

Para un tile en `(tileX, tileZ)` de un grid de tamaño `gridSize`:

```glsl
float tileSize = 1.0 / gridSize;

// tileZ se INVIERTE porque row=0 debe mapear a V alto (parte superior)
float invertedZ = gridSize - 1.0 - tileZ;

vec2 uv = vec2(
  tileX * tileSize + localUV.x * tileSize,      // U normal
  invertedZ * tileSize + localUV.y * tileSize   // V invertido
);
```

### 3.3 Por qué se invierte tileZ

| Tile Position | Sin invertir | Con invertir |
|---------------|--------------|--------------|
| `tileZ = 0` (row 0, techo) | V ≈ 0 (parte inferior) ❌ | V ≈ 1 (parte superior) ✅ |
| `tileZ = 5` (row 5, base) | V ≈ 1 (parte superior) ❌ | V ≈ 0 (parte inferior) ✅ |

---

## 4. Flujo de Datos

### 4.1 Generación del Puzzle

```
1. Imagen Original (6x6 tiles)
   ├── row=0, column=0..5 (techo de la casa)
   ├── row=1, column=0..5
   ├── ...
   └── row=5, column=0..5 (base de la casa)

2. createTileGrid(6)
   ├── tile[0][0] → gridPosition: {x:0, z:5}  (row=0 → Z=5)
   ├── tile[0][1] → gridPosition: {x:1, z:5}
   ├── ...
   └── tile[5][5] → gridPosition: {x:5, z:0}  (row=5 → Z=0)

3. fillGridWithTetrominos(6, seed)
   └── Genera piezas de Tetris que cubren el grid

4. assignTilesToPieces()
   └── Cada pieza recibe los tiles correspondientes a sus celdas
```

### 4.2 Renderizado

```
1. PuzzleFloor
   └── Renderiza imagen completa en el suelo (Y = -halfSize)

2. PuzzleTileCube (para cada bloque de pieza)
   ├── Posición: usa gridPosition del tile
   ├── UV: invierte tileZ para corregir orientación
   └── Resultado: tile coincide con su porción del suelo
```

---

## 5. Validaciones Implementadas

### 5.1 validateGridOrientation()

Verifica que TODOS los tiles del grid tengan orientación `[1,2,3,4]`.

```typescript
const result = validateGridOrientation(tileGrid);
// result.isValid = true si todos son [1,2,3,4]
// result.invalidTiles = lista de tiles con orientación incorrecta
```

### 5.2 validatePieceTilesOrientation()

Verifica que todos los tiles de todas las piezas tengan orientación base.

### 5.3 areTilesConnected()

Verifica que los tiles de una pieza sean vecinos reales en la imagen original.

---

## 6. Errores Comunes y Soluciones

### Error: "Imagen de tiles invertida respecto al suelo"

**Causa:** Falta la inversión de `tileZ` en el shader.

**Solución:** Usar `invertedZ = gridSize - 1.0 - tileZ` en el cálculo de UV.

### Error: "Piezas posicionadas en fila incorrecta"

**Causa:** Mapeo directo de `row` a `Z` sin invertir.

**Solución:** Usar `gridPosition.z = gridSize - 1 - row`.

### Error: "Tile muestra porción incorrecta de imagen"

**Causa:** `getTileByGridPosition` no invierte el cálculo.

**Solución:** Usar `row = gridSize - 1 - z` para obtener el tile correcto.

---

## 7. Resumen de Inversiones

| Componente | Qué se invierte | Fórmula |
|------------|-----------------|---------|
| `createTileGrid` | row → Z | `z = gridSize - 1 - row` |
| `getTileByGridPosition` | Z → row | `row = gridSize - 1 - z` |
| `PuzzleTileCube` shader | tileZ → UV.v | `invertedZ = gridSize - 1 - tileZ` |

---

## 8. Diagrama Visual Completo

```
IMAGEN ORIGINAL          GRID DE TILES           ESPACIO 3D
(como se ve en editor)   (datos internos)        (como se renderiza)

row=0 ┌──────────┐      tile[0][*].z = 5       Z=5 ┌──────────┐ (cerca)
      │  TECHO   │                                 │  TECHO   │
row=1 │          │      tile[1][*].z = 4       Z=4 │          │
      │          │                                 │          │
row=2 │          │      tile[2][*].z = 3       Z=3 │          │
      │          │                                 │          │
row=3 │          │      tile[3][*].z = 2       Z=2 │          │
      │          │                                 │          │
row=4 │          │      tile[4][*].z = 1       Z=1 │          │
      │          │                                 │          │
row=5 │  BASE    │      tile[5][*].z = 0       Z=0 │  BASE    │ (lejos)
      └──────────┘                                 └──────────┘
      
      column 0→5         tile[*][col].x = col      X = 0→5
```

---

## 9. Contacto y Mantenimiento

Si modificas cualquier código relacionado con:
- `puzzleTile.ts`
- `puzzleGenerator.ts`
- `PuzzleTileCube.tsx`
- `PuzzleFloor.tsx`

**SIEMPRE** verifica que las inversiones de coordenadas se mantengan consistentes según esta guía.

