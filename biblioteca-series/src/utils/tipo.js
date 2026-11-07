// Texto según el tipo guardado: "movie" (película), "series" (serie) o sin dato
export function nombreTipo(tipo) {
  if (tipo === "movie") return "Película";
  if (tipo === "series") return "Serie";
  return "";
}
