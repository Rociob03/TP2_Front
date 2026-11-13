// Conexión con TMDB (The Movie Database): estrenos, tendencias, mejor puntuadas
// y plataformas donde ver cada título en Argentina.
// Documentación: https://developer.themoviedb.org/
// "Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB."
// La app no llama a TMDB directamente: le pide los datos a la función del servidor /api/tmdb,
// que agrega la clave (TMDB_API_KEY) y consulta a TMDB. Así la clave no llega al navegador.
const FUNCION = "/api/tmdb";
const IMAGENES = "https://image.tmdb.org/t/p/w342";
const IDIOMA = "es-MX"; // títulos y sinopsis en español latino
const PAIS = "AR";

async function pedir(ruta, parametros = {}, signal) {
  const url = `${FUNCION}?${new URLSearchParams({ ruta, language: IDIOMA, ...parametros })}`;
  let respuesta;
  try {
    respuesta = await fetch(url, { signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error("No se pudo conectar con TMDB. Revisá tu conexión.");
  }
  if (respuesta.status === 500) throw new Error("Falta configurar la clave de TMDB en el servidor.");
  if (respuesta.status === 401) throw new Error("La clave de TMDB no es válida.");
  if (respuesta.status === 429) throw new Error("Demasiadas consultas a TMDB. Probá en un momento.");
  if (!respuesta.ok) throw new Error(`TMDB respondió con un error (${respuesta.status}).`);
  return respuesta.json();
}

// Fecha "AAAA-MM-DD" a tantos días de hoy (negativo = hacia atrás)
const fechaISO = (dias) => new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
const DIAS_ESTRENO = 120; // qué tan reciente tiene que ser algo para contar como estreno

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
    tituloOriginal: r.original_title || r.original_name || "",
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
  // Estrenos reales de los últimos 4 meses:
  // - películas en cartelera en Argentina (sin reestrenos de clásicos)
  // - series NUEVAS (que empezaron hace poco) disponibles en streaming en Argentina
  estrenos: () =>
    recordar("estrenos", async () => {
      const desde = fechaISO(-DIAS_ESTRENO);
      const hoy = fechaISO(0);
      const [nombres, cines, series] = await Promise.all([
        generos(),
        pedir("/movie/now_playing", { region: PAIS }),
        pedir("/discover/tv", {
          "first_air_date.gte": desde,
          "first_air_date.lte": hoy,
          sort_by: "popularity.desc",
          watch_region: PAIS,
          with_watch_monetization_types: "flatrate",
        }),
      ]);
      const peliculasNuevas = cines.results.filter((r) => r.release_date && r.release_date >= desde);
      return mezclar(
        // Las de /movie/now_playing con región AR están en cartelera en Argentina
        peliculasNuevas.map((r) => ({ ...normalizar(r, nombres, "movie"), enCines: true })),
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

// Tráiler en YouTube (primero en español, si no en inglés). Devuelve la clave del video o null.
export function obtenerTrailer(item) {
  const ruta = item.tipo === "series" ? "tv" : "movie";
  return recordar(`trailer-${ruta}-${item.tmdbId}`, async () => {
    const elegir = (videos) => {
      const deYoutube = (videos?.results || []).filter((v) => v.site === "YouTube");
      return (
        deYoutube.find((v) => v.type === "Trailer" && v.official) ||
        deYoutube.find((v) => v.type === "Trailer") ||
        deYoutube.find((v) => v.type === "Teaser") ||
        null
      );
    };
    const enEspanol = elegir(await pedir(`/${ruta}/${item.tmdbId}/videos`));
    if (enEspanol) return enEspanol.key;
    const enIngles = elegir(await pedir(`/${ruta}/${item.tmdbId}/videos`, { language: "en-US" }));
    return enIngles?.key || null;
  });
}

// Encuentra en TMDB un título de la biblioteca: por su código de TMDB, de IMDb o, si no, por nombre
async function resolverEnTmdb(serie) {
  if (serie.tmdbId && serie.tipo) return { tmdbId: serie.tmdbId, tipo: serie.tipo };
  if (serie.imdbID) {
    const encontrado = await pedir(`/find/${serie.imdbID}`, { external_source: "imdb_id" });
    const s = encontrado.tv_results?.[0];
    const p = encontrado.movie_results?.[0];
    if (s) return { tmdbId: s.id, tipo: "series" };
    if (p) return { tmdbId: p.id, tipo: "movie" };
  }
  const titulo = serie.titulo.replace(/\(\d{4}\)/, "").trim();
  const resultados = await pedir("/search/multi", { query: titulo });
  const primero = resultados.results?.find((r) => r.media_type === "movie" || r.media_type === "tv");
  return primero ? { tmdbId: primero.id, tipo: primero.media_type === "tv" ? "series" : "movie" } : null;
}

// Arma la ficha (como las de Estrenos) para un título de la biblioteca de Reel Club
export async function fichaDesdeSerie(serie) {
  const ref = await resolverEnTmdb(serie);
  if (!ref) return null;
  const estrenos = await LISTAS_TMDB.estrenos().catch(() => []);
  return {
    ...ref,
    titulo: serie.titulo,
    poster: serie.poster || "",
    anio: serie.anio ? String(serie.anio) : "",
    genero: serie.genero || "",
    trama: serie.trama || "",
    ratingImdb: serie.rating || "",
    enCines: ref.tipo === "movie" && estrenos.some((e) => e.enCines && e.tmdbId === ref.tmdbId),
    serie, // el título original de la biblioteca
  };
}

// Dónde se puede ver en Argentina (datos de JustWatch, a través de TMDB)
export function proveedoresAR(item) {
  const ruta = item.tipo === "series" ? "tv" : "movie";
  return recordar(`proveedores-${ruta}-${item.tmdbId}`, async () => {
    const datos = await pedir(`/${ruta}/${item.tmdbId}/watch/providers`);
    const ar = datos.results?.[PAIS] || {};
    const pasar = (lista = []) =>
      lista.map((p) => ({
        nombre: p.provider_name,
        logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : "",
      }));
    return { streaming: pasar(ar.flatrate), alquiler: pasar(ar.rent), compra: pasar(ar.buy), link: ar.link || null };
  });
}

// ---------- Búsqueda por actor o actriz ----------

// Personas que coinciden con el nombre (primero quienes actúan)
export async function buscarPersonas(texto, signal) {
  const datos = await pedir("/search/person", { query: texto }, signal);
  return datos.results
    .filter((p) => p.known_for_department === "Acting")
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      nombre: p.name,
      conocidoPor: (p.known_for || []).map((k) => k.title || k.name).filter(Boolean).slice(0, 2).join(", "),
    }));
}

// Géneros que no son ficción (talk shows, noticias, realities): se excluyen de la filmografía
const NO_FICCION = new Set([10767, 10763, 10764]);
const ES_EL_MISMO = /^(self|himself|herself|themselves|él mismo|ella misma)\b/i;

// Películas y series en las que actuó, de la más popular a la menos
export function filmografia(personaId) {
  return recordar(`filmografia-${personaId}`, async () => {
    const [nombres, datos] = await Promise.all([generos(), pedir(`/person/${personaId}/combined_credits`)]);
    const vistos = new Set();
    return datos.cast
      .filter((r) => (r.media_type === "movie" || r.media_type === "tv") && r.poster_path)
      .filter((r) => !(r.genre_ids || []).some((g) => NO_FICCION.has(g)) && !ES_EL_MISMO.test(r.character || ""))
      .filter((r) => {
        const clave = `${r.media_type}-${r.id}`; // una serie aparece una vez por temporada: se deja una sola
        if (vistos.has(clave)) return false;
        vistos.add(clave);
        return true;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 24)
      .map((r) => ({ ...normalizar(r, nombres), personaje: (r.character || "").split("/")[0].trim() }));
  });
}

// ---------- Búsqueda por país de origen ----------

// Lista de países (los nombres en español los da el navegador)
export function paises() {
  return recordar("paises", async () => {
    const lista = await pedir("/configuration/countries");
    let traductor = null;
    try { traductor = new Intl.DisplayNames(["es"], { type: "region" }); } catch { /* navegador viejo */ }
    return lista
      .map((p) => {
        let nombre = p.native_name || p.english_name;
        try { nombre = traductor?.of(p.iso_3166_1) || nombre; } catch { /* código raro */ }
        return { codigo: p.iso_3166_1, nombre };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  });
}

// Películas o series de un país, de la más popular a la menos (de a 20)
export function porPais(codigo, tipo, pagina = 1) {
  const ruta = tipo === "series" ? "tv" : "movie";
  return recordar(`pais-${codigo}-${ruta}-${pagina}`, async () => {
    const [nombres, datos] = await Promise.all([
      generos(),
      pedir(`/discover/${ruta}`, {
        with_origin_country: codigo,
        sort_by: "popularity.desc",
        "vote_count.gte": 10, // evita títulos casi desconocidos o sin datos
        page: pagina,
      }),
    ]);
    return {
      items: datos.results.map((r) => normalizar(r, nombres, ruta)).filter((x) => x.poster),
      hayMas: datos.page < Math.min(datos.total_pages, 10),
    };
  });
}

// Buscador por título: TMDB encuentra mientras se escribe ("insidi" → "La noche del demonio / Insidious")
// y devuelve títulos y géneros en español
export async function buscarTitulosTmdb(texto, signal) {
  const [nombres, datos] = await Promise.all([
    generos(),
    pedir("/search/multi", { query: texto, include_adult: "false" }, signal),
  ]);
  return datos.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 10)
    .map((r) => normalizar(r, nombres));
}
