// Sticker con la plataforma. Si no se sabe ("Sin confirmar"), es un botón que abre la ficha
export default function StickerPlataforma({ serie, variante, onAbrirFicha }) {
  if (serie.plataforma === "Sin confirmar") {
    return (
      <button
        type="button"
        className="sticker sin-confirmar"
        onClick={() => onAbrirFicha(serie)}
        title="Ver dónde se puede ver"
      >
        ¿Dónde la veo?
      </button>
    );
  }
  return <span className={`sticker v${variante}`}>{serie.plataforma}</span>;
}
