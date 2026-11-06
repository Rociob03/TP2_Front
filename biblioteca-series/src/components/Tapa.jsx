// Póster de IMDb. Si la serie no tiene póster (o la imagen falla), no muestra nada.
export default function Tapa({ serie, className = "tapa" }) {
  if (!serie.poster) return null;
  return (
    <img
      className={className}
      src={serie.poster}
      alt={`Póster de ${serie.titulo}`}
      loading="lazy"
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}
