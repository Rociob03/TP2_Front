import { useState } from "react";

// "4.5" → "4½"
export const textoEstrellas = (n) =>
  n ? `${Math.floor(n) || ""}${n % 1 ? "½" : ""}` : "";

/**
 * Calificación de ½ a 5 estrellas, como en Letterboxd.
 * Cada estrella tiene dos mitades: la izquierda vale media estrella.
 * Tocar de nuevo la calificación actual la borra.
 */
export default function Estrellas({ valor = 0, onCambiar, soloLectura = false, titulo = "" }) {
  const [hover, setHover] = useState(null);
  const mostrado = hover ?? valor ?? 0;

  const elegir = (n) => onCambiar?.(n === valor ? null : n);

  return (
    <div
      className={`estrellas ${soloLectura ? "solo-lectura" : ""}`}
      role={soloLectura ? "img" : "radiogroup"}
      aria-label={
        soloLectura
          ? `${textoEstrellas(valor) || "Sin"} estrellas`
          : `Calificá ${titulo}`.trim()
      }
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const relleno = Math.max(0, Math.min(1, mostrado - (n - 1))) * 100;
        return (
          <span className="estrella" key={n}>
            <span className="estrella-fondo" aria-hidden="true">★</span>
            <span className="estrella-relleno" style={{ width: `${relleno}%` }} aria-hidden="true">★</span>
            {!soloLectura &&
              [n - 0.5, n].map((v, i) => (
                <button
                  key={v}
                  type="button"
                  className={`mitad ${i === 0 ? "izq" : "der"}`}
                  role="radio"
                  aria-checked={valor === v}
                  aria-label={`${textoEstrellas(v)} ${v <= 1 ? "estrella" : "estrellas"}`}
                  onMouseEnter={() => setHover(v)}
                  onFocus={() => setHover(v)}
                  onBlur={() => setHover(null)}
                  onClick={() => elegir(v)}
                />
              ))}
          </span>
        );
      })}
    </div>
  );
}
