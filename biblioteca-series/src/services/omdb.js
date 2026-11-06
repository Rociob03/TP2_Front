// Conexión con OMDb (Open Movie Database), que trae los datos de IMDb.
// Documentación: https://www.omdbapi.com/
const CLAVE = import.meta.env.VITE_OMDB_API_KEY;
const URL_BASE = "https://www.omdbapi.com/";

// OMDb devuelve "N/A" cuando un dato no existe: lo convertimos en vacío.
const limpio = (v) => (v && v !== "N/A" ? v : "");

const GENEROS = {
  Action: "Acción", Adventure: "Aventura", Animation: "Animación", Biography: "Biografía",
  Comedy: "Comedia", Crime: "Policial", Documentary: "Documental", Drama: "Drama",
  Family: "Familiar", Fantasy: "Fantasía", History: "Historia", Horror: "Terror",
  Music: "Música", Musical: "Musical", Mystery: "Misterio", Romance: "Romance",
  "Sci-Fi": "Ciencia ficción", Sport: "Deporte", Thriller: "Suspenso", War: "Bélico",
  Western: "Western", "Reality-TV": "Reality", "Talk-Show": "Talk show",
  "Game-Show": "Concurso", News: "Noticias", Short: "Corto", "Film-Noir": "Cine negro",
};

const ERRORES = {
  "Invalid API key!": "La clave de OMDb no es válida o no está activada.",
  "No API key provided.": "Falta la clave de OMDb (VITE_OMDB_API_KEY).",
  "Request limit reached!": "Se alcanzó el límite diario de búsquedas en IMDb. Probá mañana.",
  "Too many results.": "Hay demasiados resultados: escribí un poco más del título.",
};

// Traduce los géneros y los recorta para que entren en el campo (máx. 40 caracteres).
function traducirGeneros(texto, max = 40) {
  let salida = "";
  for (const g of limpio(texto).split(",").map((x) => x.trim()).filter(Boolean)) {
    const nuevo = salida ? `${salida}, ${GENEROS[g] || g}` : GENEROS[g] || g;
    if (nuevo.length > max) break;
    salida = nuevo;
  }
  return salida;
}

async function pedir(parametros, signal) {
  if (!CLAVE) throw new Error(ERRORES["No API key provided."]);
  const url = `${URL_BASE}?${new URLSearchParams({ apikey: CLAVE, ...parametros })}`;

  let respuesta;
  try {
    respuesta = await fetch(url, { signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error("No se pudo conectar con IMDb. Revisá tu conexión.");
  }
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new Error(ERRORES[datos.Error] || `IMDb respondió con un error (${respuesta.status}).`);
  }

  const datos = await respuesta.json();
  if (datos.Response === "False") {
    if (datos.Error === "Movie not found!" || datos.Error === "Series or episode not found!") return null;
    throw new Error(ERRORES[datos.Error] || datos.Error);
  }
  return datos;
}

// Busca películas y series por título. Devuelve hasta 10 resultados.
export async function buscarTitulos(texto, signal) {
  const datos = await pedir({ s: texto }, signal);
  if (!datos) return [];
  return datos.Search
    .filter((r) => r.Type === "series" || r.Type === "movie")
    .map((r) => ({
      imdbID: r.imdbID,
      titulo: r.Title,
      anio: limpio(r.Year),
      tipo: r.Type,
      poster: limpio(r.Poster),
    }));
}

// Trae la ficha completa de un título a partir de su ID de IMDb (ej. "tt0903747").
export async function obtenerDetalle(imdbID) {
  const d = await pedir({ i: imdbID, plot: "short" });
  if (!d) throw new Error("No se encontró ese título en IMDb.");
  return {
    imdbID: d.imdbID,
    titulo: d.Title,
    anio: limpio(d.Year),
    tipo: d.Type,
    genero: traducirGeneros(d.Genre),
    poster: limpio(d.Poster),
    rating: limpio(d.imdbRating),
    trama: limpio(d.Plot),
  };
}
