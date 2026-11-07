// Conexión con TMDB (The Movie Database): estrenos, tendencias, mejor puntuadas
// y plataformas donde ver cada título en Argentina.
// Documentación: https://developer.themoviedb.org/
// "Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB."
const CLAVE = import.meta.env.VITE_TMDB_API_KEY;
const URL_BASE = "https://api.themoviedb.org/3";
const IMAGENES = "https://image.tmdb.org/t/p/w342";
const IDIOMA = "es-MX"; // títulos y sinopsis en español latino
const PAIS = "AR";

async function pedir(ruta, parametros = {}) {
  if (!CLAVE) throw new Error("Falta la clave de TMDB (VITE_TMDB_API_KEY).");
  const url = `${URL_BASE}${ruta}?${new URLSearchParams({ api_key: CLAVE, language: IDIOMA, ...parametros })}`;
  let respuesta;
  try {
    respuesta = await fetch(url);
  } catch {
    throw new Error("No se pudo conectar con TMDB. Revisá tu conexión.");
  }
  if (respuesta.status === 401) throw new Error("La clave de TMDB no es válida.");
  if (respuesta.status === 429) throw new Error("Demasiadas consultas a TMDB. Probá en un momento.");
  if (!respuesta.ok) throw new Error(`TMDB respondió con un error (${respuesta.status}).`);
  return respuesta.json();
}

// Las listas se guardan en memoria para no repetir consultas al cambiar de pestaña
const memoria = new Map();
const recordar = (clave, fn) => {
  if (!memoria.has(clave)) {
    memoria.set(clave, fn().catch((e) => { memoria.delete(clave); throw e; }));
  }
  return memoria.get(clave);
};

// Nombres de los géneros en español (TMDB devuelve solo los números)
const generos = () =>
  recordar("generos", async () => {
    const [peliculas, series] = await Promise.all([pedir("/genre/movie/list"), pedir("/genre/tv/list")]);
    return new Map([...peliculas.genres, ...series.genres].map((g) => [g.id, g.name]));
  });

function generosEnTexto(ids = [], nombres, max = 40) {
  let salida = "";
  for (const id of ids) {
    const nombre = nombres.get(id);
    if (!nombre) continue;
    const nuevo = salida ? `${salida}, ${nombre}` : nombre;
    if (nuevo.length > max) break;
    salida = nuevo;
  }
  return salida;
}

// Pasa un resultado de TMDB al formato que usa la app
function normalizar(r, nombres, tipoPorDefecto) {
  const tipo = (r.media_type || tipoPorDefecto) === "tv" ? "series" : "movie";
  return {
    tmdbId: r.id,
    tipo,
    titulo: r.title || r.name,
    anio: (r.release_date || r.first_air_date || "").slice(0, 4),
    poster: r.poster_path ? `${IMAGENES}${r.poster_path}` : "",
    trama: r.overview || "",
    genero: generosEnTexto(r.genre_ids, nombres),
    puntajeTmdb: r.vote_average ? r.vote_average.toFixed(1) : "",
  };
}

// Intercala dos listas (película, serie, película...) y saca las que no tienen póster
function mezclar(a, b, cantidad = 16) {
  const salida = [];
  for (let i = 0; salida.length < cantidad && (i < a.length || i < b.length); i++) {
    if (a[i]) salida.push(a[i]);
    if (b[i]) salida.push(b[i]);
  }
  return salida.filter((x) => x.poster).slice(0, cantidad);
}

export const LISTAS_TMDB = {
  estrenos: () =>
    recordar("estrenos", async () => {
      const [nombres, cines, series] = await Promise.all([
        generos(),
        pedir("/movie/now_playing", { region: PAIS }),
        pedir("/tv/on_the_air"),
      ]);
      return mezclar(
        cines.results.map((r) => normalizar(r, nombres, "movie")),
        series.results.map((r) => normalizar(r, nombres, "tv"))
      );
    }),

  tendencias: () =>
    recordar("tendencias", async () => {
      const [nombres, datos] = await Promise.all([generos(), pedir("/trending/all/week")]);
      return datos.results
        .filter((r) => r.media_type === "movie" || r.media_type === "tv")
        .map((r) => normalizar(r, nombres))
        .filter((x) => x.poster)
        .slice(0, 16);
    }),

  mejorPuntuadas: () =>
    recordar("mejor", async () => {
      const [nombres, peliculas, series] = await Promise.all([
        generos(),
        pedir("/movie/top_rated"),
        pedir("/tv/top_rated"),
      ]);
      return mezclar(
        peliculas.results.map((r) => normalizar(r, nombres, "movie")),
        series.results.map((r) => normalizar(r, nombres, "tv"))
      );
    }),
};

// Plataformas de Argentina → nombres que usa la app
const PLATAFORMAS_TMDB = [
  [/netflix/i, "Netflix"],
  [/disney/i, "Disney+"],
  [/^(hbo )?max\b|hbo/i, "HBO Max"],
  [/amazon|prime video/i, "Prime Video"],
  [/apple tv/i, "Apple TV+"],
  [/paramount/i, "Paramount+"],
  [/^flow/i, "Flow"],
  [/crunchyroll/i, "Crunchyroll"],
  [/mubi/i, "Mubi"],
];

export const SIN_CONFIRMAR = "Sin confirmar";

// Plataforma de streaming (suscripción) en Argentina a partir de la respuesta de TMDB.
// Si no está en ninguna, devuelve "Sin confirmar"; si está en una que la app no lista, "Otra".
function plataformaDesde(proveedores) {
  const enAR = proveedores?.results?.[PAIS]?.flatrate || [];
  if (enAR.length === 0) return SIN_CONFIRMAR;
  for (const p of enAR) {
    const encontrada = PLATAFORMAS_TMDB.find(([patron]) => patron.test(p.provider_name));
    if (encontrada) return encontrada[1];
  }
  return "Otra";
}

// Datos extra para guardar un título de TMDB en la biblioteca:
// en qué plataforma está en Argentina y su código de IMDb
export async function datosParaGuardar(item) {
  const ruta = item.tipo === "series" ? "tv" : "movie";
  const [proveedores, externos] = await Promise.all([
    pedir(`/${ruta}/${item.tmdbId}/watch/providers`).catch(() => null),
    pedir(`/${ruta}/${item.tmdbId}/external_ids`).catch(() => null),
  ]);
  return { plataforma: plataformaDesde(proveedores), imdbID: externos?.imdb_id || null };
}

// Para títulos elegidos con el buscador de IMDb: se busca en TMDB por su código de IMDb
// y se devuelve la plataforma en Argentina (o "Sin confirmar")
export async function plataformaPorImdb(imdbID) {
  const encontrado = await pedir(`/find/${imdbID}`, { external_source: "imdb_id" });
  const peli = encontrado.movie_results?.[0];
  const serie = encontrado.tv_results?.[0];
  if (!peli && !serie) return { plataforma: SIN_CONFIRMAR, tmdbId: null };
  const ruta = serie ? "tv" : "movie";
  const id = (serie || peli).id;
  const proveedores = await pedir(`/${ruta}/${id}/watch/providers`).catch(() => null);
  return { plataforma: plataformaDesde(proveedores), tmdbId: id };
}
