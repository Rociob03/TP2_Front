import { Bookmark, Check, Close } from "pixelarticons/react";

// Botón "Guardar para ver" que funciona como interruptor:
// si ya está en tu lista muestra "✓ En tu lista" y, al pasar el mouse, "Quitar de mi lista".
export default function BotonLista({ enLista, guardando = false, onGuardar, onQuitar, titulo = "" }) {
  if (enLista) {
    return (
      <button
        type="button"
        className="btn primario boton-lista en-lista"
        onClick={onQuitar}
        aria-label={`Quitar "${titulo}" de mi lista`}
        title="Quitar de mi lista"
      >
        <span className="boton-lista-normal"><Check className="icono" /> En tu lista</span>
        <span className="boton-lista-quitar" aria-hidden="true"><Close className="icono" /> Quitar de mi lista</span>
      </button>
    );
  }
  return (
    <button type="button" className="btn primario boton-lista" onClick={onGuardar} disabled={guardando}>
      <Bookmark className="icono" /> {guardando ? "Guardando..." : "Guardar para ver"}
    </button>
  );
}
