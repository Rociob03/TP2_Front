import { Heart } from "pixelarticons/react";

// Botón de favorita (con un "latido" al marcarla)
export default function Corazon({ activo, onCambiar, titulo }) {
  return (
    <button
      type="button"
      className={`corazon ${activo ? "activo" : ""}`}
      onClick={onCambiar}
      aria-pressed={!!activo}
      aria-label={activo ? `Quitar "${titulo}" de favoritas` : `Agregar "${titulo}" a favoritas`}
      title={activo ? "Quitar de favoritas" : "Agregar a favoritas"}
    >
      <Heart className="icono" />
    </button>
  );
}
