import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// En Vercel, los archivos de /api corren solos como funciones del servidor.
// Con "npm run dev" no existe ese servidor, así que este plugin atiende /api/tmdb y /api/omdb
// en la compu con el mismo código, leyendo las claves del .env (sin VITE_, no llegan al navegador).
function funcionesLocales(env) {
  return {
    name: "funciones-locales",
    configureServer(server) {
      process.env.TMDB_API_KEY ??= env.TMDB_API_KEY;
      process.env.OMDB_API_KEY ??= env.OMDB_API_KEY;
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        const nombre = { "/api/tmdb": "tmdb", "/api/omdb": "omdb" }[url.pathname];
        if (!nombre) return next();
        const { default: handler } = await server.ssrLoadModule(`/api/${nombre}.js`);
        const respuesta = {
          status(codigo) { res.statusCode = codigo; return this; },
          setHeader(k, v) { res.setHeader(k, v); return this; },
          json(datos) { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(datos)); return this; },
        };
        await handler({ query: Object.fromEntries(url.searchParams) }, respuesta);
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), funcionesLocales(loadEnv(mode, process.cwd(), ""))],
}));
