# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Configuración de la ruta de acceso

El formulario de login puede exponerse en una ruta distinta sin modificar la lógica existente. Para ello se añadieron tres variables de entorno opcionales que se leen desde el cliente (usa un archivo `.env` o configura las variables en la plataforma donde desplegues la app):

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `VITE_LOGIN_PATH` | Segmento de URL donde vivirá el formulario de login. Solo se toman en cuenta los caracteres después del dominio. | `login` |
| `VITE_ROOT_REDIRECT_TO_LOGIN` | Controla si la ruta `/` redirige automáticamente hacia la ruta del login. Útil para ocultar la ubicación real del formulario cuando se establece en `true`. | `false` |
| `VITE_KEEP_LEGACY_LOGIN_PATH` | Si se define en `true`, mantiene el camino antiguo `/login` como un alias que redirige al nuevo. Déjalo en `false` para ocultarlo. | `false` |

Ejemplo de configuración para ocultar el acceso al panel:

```ini
VITE_LOGIN_PATH=panel-super-seguro
VITE_ROOT_REDIRECT_TO_LOGIN=false
```

Con esos valores, la pantalla de autenticación quedará disponible en `https://tu-dominio/panel-super-seguro` y la ruta raíz (`/`) dejará de revelar automáticamente dicha dirección.
