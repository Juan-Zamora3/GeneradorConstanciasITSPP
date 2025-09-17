// src/utilidades/rutasConfig.js
// Centraliza configuraciones de rutas sensibles como la del login.

const rawLoginPath = (import.meta.env.VITE_LOGIN_PATH ?? 'login').trim();
const sanitizedLogin = rawLoginPath.replace(/^\/+/u, '').replace(/\/+$/u, '') || 'login';

export const LOGIN_PATH = `/${sanitizedLogin}`;

const rootRedirectSetting = (import.meta.env.VITE_ROOT_REDIRECT_TO_LOGIN ?? 'false')
  .toString()
  .trim()
  .toLowerCase();
export const ROOT_REDIRECTS_TO_LOGIN = rootRedirectSetting === 'true';

const legacySetting = import.meta.env.VITE_KEEP_LEGACY_LOGIN_PATH ?? 'false';
export const KEEP_LEGACY_LOGIN_PATH = legacySetting === 'true';

export const LEGACY_LOGIN_PATH = '/login';
