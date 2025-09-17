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

const sanitizedLogin = sanitizeLoginPathSegment(import.meta.env.VITE_LOGIN_PATH);

export const LOGIN_PATH = `/${sanitizedLogin}`;

export const ROOT_REDIRECTS_TO_LOGIN = toBooleanEnvFlag(
  import.meta.env.VITE_ROOT_REDIRECT_TO_LOGIN,
  false,
);

export const KEEP_LEGACY_LOGIN_PATH = toBooleanEnvFlag(
  import.meta.env.VITE_KEEP_LEGACY_LOGIN_PATH,
  false,
);

const rawLoginPath = (import.meta.env.VITE_LOGIN_PATH ?? 'login').trim();
const sanitizedLogin = rawLoginPath.replace(/^\/+/u, '').replace(/\/+$/u, '') || 'login';

export const LOGIN_PATH = `/${sanitizedLogin}`;


const rootRedirectSetting = (import.meta.env.VITE_ROOT_REDIRECT_TO_LOGIN ?? 'false')
  .toString()
  .trim()
  .toLowerCase();
export const ROOT_REDIRECTS_TO_LOGIN = rootRedirectSetting === 'true';

const rootRedirectSetting = import.meta.env.VITE_ROOT_REDIRECT_TO_LOGIN ?? 'true';
export const ROOT_REDIRECTS_TO_LOGIN = rootRedirectSetting !== 'false';


const legacySetting = import.meta.env.VITE_KEEP_LEGACY_LOGIN_PATH ?? 'false';
export const KEEP_LEGACY_LOGIN_PATH = legacySetting === 'true';


export const LEGACY_LOGIN_PATH = '/login';
