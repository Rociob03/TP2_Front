import { useState } from "react";

// Póster de IMDb. Si no hay (o la imagen falla):
// - con generica=true muestra una carátula VHS armada con el título
// - si no, no muestra nada
export default function Tapa({ serie, className = "tapa", generica = false }) {
  const [fallo, setFallo] = useState(false);

  if (serie.poster && !fallo) {
    return (
      <img
        className={className}
        src={serie.poster}
        alt={`Póster de ${serie.titulo}`}
        loading="lazy"
        onError={() => setFallo(true)}
      />
    );
  }
  if (!generica) return null;

  // Color de la carátula según el título, para que no sean todas iguales
  const tono = [...serie.titulo].reduce((n, c) => n + c.charCodeAt(0), 0) % 4;
  return (
    <div className={`${className} tapa-generica t${tono}`} role="img" aria-label={`Carátula de ${serie.titulo}`}>
      <span className="tapa-generica-marca">REEL CLUB</span>
      <span className="tapa-generica-titulo">{serie.titulo}</span>
      <span className="tapa-generica-pie">{serie.genero || "VHS"}</span>
    </div>
  );
}
