// src/utilidades/rutasConfig.js
// Centraliza configuraciones de rutas sensibles como la del login.

function sanitizeLoginPathSegment(rawValue) {
  if (typeof rawValue !== 'string') return 'login';
  const trimmed = rawValue.trim();
  const withoutSlashes = trimmed.replace(/^\/+/u, '').replace(/\/+$/u, '');
  return withoutSlashes || 'login';
}

function toBooleanEnvFlag(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  return value.toString().trim().toLowerCase() === 'true';
}

// ✅ Solo una vez, sin duplicados
const sanitizedLogin = sanitizeLoginPathSegment(import.meta.env.VITE_LOGIN_PATH ?? 'login');

// Path principal de login
export const LOGIN_PATH = `/${sanitizedLogin}`;

// Redirección raíz → login (true/false)
export const ROOT_REDIRECTS_TO_LOGIN = toBooleanEnvFlag(
  import.meta.env.VITE_ROOT_REDIRECT_TO_LOGIN,
  true
);

// Mantener ruta de login heredada (/login además del path nuevo)
export const KEEP_LEGACY_LOGIN_PATH = toBooleanEnvFlag(
  import.meta.env.VITE_KEEP_LEGACY_LOGIN_PATH,
  false
);

// Ruta heredada fija
export const LEGACY_LOGIN_PATH = '/login';
