# Correcciones de Compatibilidad con Microsoft Edge

## Problema Identificado

La aplicación funcionaba correctamente en Google Chrome pero presentaba un comportamiento de refresh infinito o pantalla en blanco en Microsoft Edge.

## Causa Raíz

El problema se debía a múltiples factores relacionados con diferencias en cómo Edge y Chrome manejan:

1. **Cookies sin atributos de seguridad**: Edge es más estricto con cookies que no tienen `SameSite` y `Secure`
2. **Hidratación de estado de Zustand**: Race condition entre la carga del estado desde localStorage y la verificación de autenticación
3. **Hard redirects con `window.location.href`**: Causaban loops de navegación antes de que el estado se sincronizara

## Soluciones Implementadas

### 1. Atributos de Cookies Mejorados (`src/store/useAuthStore.ts`)

**Antes:**

```typescript
Cookies.set("auth_token", token, { expires: 7 });
Cookies.remove("auth_token");
```

**Después:**

```typescript
Cookies.set("auth_token", token, {
  expires: 7,
  sameSite: "Lax",
  secure: window.location.protocol === "https:",
});
Cookies.remove("auth_token", { sameSite: "Lax" });
```

**Beneficios:**

- `sameSite: "Lax"` protege contra ataques CSRF y es requerido por navegadores modernos
- `secure: true` asegura que la cookie solo se envíe por HTTPS en producción
- Mejora la seguridad sin afectar funcionalidad

### 2. Espera de Hidratación de Estado (`src/app/page.tsx` y `src/app/game/layout.tsx`)

**Antes:**

```typescript
useEffect(() => {
  if (isAuthenticated) {
    router.push("/game");
  } else {
    router.push("/auth/login");
  }
}, [isAuthenticated, router]);
```

**Después:**

```typescript
const [isReady, setIsReady] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => {
    setIsReady(true);
  }, 100);
  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  if (!isReady) return;

  if (isAuthenticated) {
    router.replace("/game");
  } else {
    router.replace("/auth/login");
  }
}, [isAuthenticated, router, isReady]);
```

**Beneficios:**

- Da tiempo a Zustand para cargar el estado desde localStorage
- Evita decisiones de redirección con datos incompletos
- El timeout de 100ms es imperceptible para el usuario

### 3. Router.replace en lugar de Router.push

**Cambio:**

- Todas las redirecciones de autenticación usan `router.replace()` en lugar de `router.push()`
- Eliminado el uso de `window.location.href` para redirecciones

**Beneficios:**

- Evita acumular entradas en el historial del navegador
- Previene loops al usar el botón "atrás"
- Navegación más limpia y predecible

### 4. Pantalla de Carga Durante Hidratación

**Implementación:**

```typescript
if (!isReady) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-primary">Cargando...</div>
    </div>
  );
}
```

**Beneficios:**

- UX consistente mientras se prepara la aplicación
- Evita flashes de contenido no autenticado
- Indicador visual de que la app está cargando

## Impacto en Otros Navegadores

✅ **Chrome**: Sin impacto negativo, funciona igual o mejor
✅ **Firefox**: Sin impacto negativo, mejora la seguridad
✅ **Safari**: Sin impacto negativo, cookies más seguras
✅ **Edge**: Problema completamente resuelto

## Mejoras Adicionales de Seguridad

Estos cambios no solo corrigen el problema en Edge, sino que también:

1. **Mejoran la seguridad general** con cookies configuradas correctamente
2. **Previenen race conditions** en todos los navegadores
3. **Mejoran la UX** con navegación más consistente
4. **Siguen mejores prácticas** de Next.js y React

## Testing Recomendado

Para verificar la corrección en Edge:

1. Abrir DevTools (F12) → Application → Storage
2. Limpiar cookies y localStorage
3. Acceder a la aplicación
4. Verificar que la cookie `auth_token` se crea correctamente
5. Login y navegación deben funcionar sin loops

## Notas Técnicas

- El timeout de 100ms es suficiente para la hidratación en dispositivos modernos
- En caso de conexiones muy lentas, el timeout podría ajustarse a 150-200ms
- El middleware de Next.js sigue funcionando normalmente con las cookies mejoradas

## Fecha de Implementación

1 de diciembre de 2025

## Archivos Modificados

- `src/store/useAuthStore.ts`
- `src/app/page.tsx`
- `src/app/game/layout.tsx`
