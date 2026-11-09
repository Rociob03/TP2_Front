import Tapa from "./Tapa";

// Póster que se puede tocar para abrir la ficha (descripción, tráiler, dónde verla)
export default function TapaBoton({ serie, onAbrir, className, generica = false }) {
  if (!serie.poster && !generica) return null; // sin póster ni carátula: no hay nada que mostrar
  if (!onAbrir) return <Tapa serie={serie} className={className} generica={generica} />;
  return (
    <button
      type="button"
      className="tapa-boton"
      onClick={() => onAbrir(serie)}
      aria-label={`Ver la ficha de "${serie.titulo}"`}
      title="Ver ficha"
    >
      <Tapa serie={serie} className={className} generica={generica} />
    </button>
  );
}
