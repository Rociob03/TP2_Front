// FUNCIÓN DEL SERVIDOR (serverless) para consultar TMDB.
// Por qué existe: una clave con prefijo VITE_ se incluye en el JavaScript que descarga
// cualquier visitante, así que quedaría expuesta. Esta función corre en el servidor de
// Vercel: lee la clave de una variable de entorno SIN el prefijo VITE_ (TMDB_API_KEY),
// consulta a TMDB y le devuelve a la app solo el resultado. La clave nunca sale del servidor.
//
// Vercel convierte cada archivo de la carpeta /api en una dirección: este responde en /api/tmdb.
// Uso: /api/tmdb?ruta=/trending/all/week&language=es-MX

const URL_BASE = "https://api.themoviedb.org/3";
// Solo se permiten rutas de lectura con letras, números, guiones y barras.
const RUTA_VALIDA = /^\/[a-z0-9_\-/]+$/i;

export default async function handler(req, res) {
  const clave = process.env.TMDB_API_KEY;
  if (!clave) return res.status(500).json({ error: "Falta la variable TMDB_API_KEY en el servidor." });

  const { ruta, ...parametros } = req.query;
  if (typeof ruta !== "string" || !RUTA_VALIDA.test(ruta)) {
    return res.status(400).json({ error: "Ruta de TMDB no válida." });
  }

  const url = `${URL_BASE}${ruta}?${new URLSearchParams({ ...parametros, api_key: clave })}`;
  try {
    const respuesta = await fetch(url);
    const datos = await respuesta.json().catch(() => ({}));
    // Vercel guarda la respuesta una hora: si alguien repite la consulta, no se vuelve a pedir.
    if (respuesta.ok) res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    return res.status(respuesta.status).json(datos);
  } catch {
    return res.status(502).json({ error: "No se pudo conectar con TMDB." });
  }
}
