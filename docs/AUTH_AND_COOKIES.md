# Autenticación, Email y Manejo de Cookies

Este documento describe el flujo de autenticación, el envío de correos, y el manejo técnico de cookies y la funcionalidad "Recordarme".

## 1. Flujo de Registro y Email

### Registro de Usuario (`/auth/register`)

1. **Formulario**: El usuario ingresa username, email y contraseña.
2. **Validación**:
   - Se valida que el username y email no existan previamente.
   - Si existen, se muestra un mensaje de error amigable.
   - La contraseña debe cumplir con la política: 8+ caracteres, 1 mayúscula, 1 número.
3. **Éxito**:
   - Al registrarse exitosamente, **NO se redirige** automáticamente al login.
   - Se muestra una vista de éxito indicando que se ha enviado un correo de confirmación.
   - Se provee un botón "Ir a Iniciar Sesión" para navegar manualmente.

### Recuperación de Contraseña (`/auth/forgot-password` y `/auth/reset-password`)

1. **Solicitud (`/auth/forgot-password`)**:
   - El usuario ingresa su email.
   - **Limpieza de Sesión**: Al solicitar el correo, se limpian proactivamente `localStorage`, `sessionStorage` y la cookie `auth_token` para asegurar que no haya sesiones activas inválidas o conflictos.
2. **Reset (`/auth/reset-password`)**:
   - El usuario llega mediante el enlace del correo (con `code`).
   - Ingresa la nueva contraseña (validada con la misma política de seguridad).
   - Manejo de errores: Si el código es inválido ("Incorrect code provided"), se notifica al usuario.
   - Éxito: Se muestra confirmación y un enlace para "Volver a iniciar sesión".

## 2. Manejo de Cookies

La aplicación utiliza cookies para la persistencia de la sesión (`auth_token`).

- **Librería**: Se utiliza `js-cookie` para el manejo consistente en el cliente.
- **Seguridad**:
  - `SameSite: Lax`
  - `Secure`: Activado si el protocolo es HTTPS.
- **Limpieza**:
  - Al cerrar sesión (`logout`).
  - Al solicitar recuperación de contraseña (medida de seguridad adicional).
  - Se fuerza la expiración mediante `Cookies.remove` y `document.cookie` para asegurar la eliminación.

## 3. Funcionalidad "Permanecer Conectado" (Remember Me)

La persistencia de la sesión depende de la selección del checkbox "Permanecer conectado" en el login.

### Lógica de Expiración

Se controla en `useAuthStore.ts` durante la acción `login`:

1. **Si "Permanecer conectado" está marcado (`true`)**:

   - La cookie `auth_token` se configura con `expires: 30` (30 días).
   - La sesión persiste aunque se cierre el navegador.

2. **Si NO está marcado (`false`)**:
   - La cookie se crea **sin fecha de expiración explícita**.
   - Se comporta como una **Session Cookie**: el navegador la elimina automáticamente al cerrarse la aplicación/navegador.

### Implementación Técnica

```typescript
// src/store/useAuthStore.ts
login: (user, token, remember) => {
  const cookieOptions: Cookies.CookieAttributes = {
    sameSite: "Lax",
    secure: window.location.protocol === "https:",
  };

  // Si remember es true, dura 30 días.
  // Si es false/undefined, es Session Cookie.
  if (remember) {
    cookieOptions.expires = 30;
  }

  Cookies.set("auth_token", token, cookieOptions);
  // ...
};
```
