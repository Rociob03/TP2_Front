// FUNCIÓN DEL SERVIDOR (serverless) para consultar OMDb (datos de IMDb).
// Igual que /api/tmdb: la clave (OMDB_API_KEY, sin VITE_) vive solo en el servidor de Vercel,
// así no aparece en el JavaScript del navegador. La app le pide los datos a /api/omdb.
// Uso: /api/omdb?i=tt0944947  ·  /api/omdb?s=breaking

const URL_BASE = "https://www.omdbapi.com/";
// Solo estos parámetros de búsqueda pasan a OMDb.
const PERMITIDOS = ["s", "i", "t", "type", "y", "plot", "page"];

export default async function handler(req, res) {
  const clave = process.env.OMDB_API_KEY;
  if (!clave) return res.status(500).json({ Response: "False", Error: "No API key provided." });

  const parametros = {};
  for (const p of PERMITIDOS) if (typeof req.query[p] === "string") parametros[p] = req.query[p];

  const url = `${URL_BASE}?${new URLSearchParams({ ...parametros, apikey: clave })}`;
  try {
    const respuesta = await fetch(url);
    const datos = await respuesta.json().catch(() => ({}));
    if (respuesta.ok) res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
    return res.status(respuesta.status).json(datos);
  } catch {
    return res.status(502).json({ Response: "False", Error: "No se pudo conectar con IMDb." });
  }
}
