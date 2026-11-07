import SerieCard from "./SerieCard";

export default function SerieList({ series, uid, idsEnLista, onAgregar, onEliminar, onBuscarPoster }) {
  if (series.length === 0) {
    return <p className="vacio">Estante vacío. ¡Cargá la primera serie!</p>;
  }
  return (
    <ul className="estante">
      {series.map((s) => (
        <SerieCard
          key={s.id}
          serie={s}
          uid={uid}
          enMiLista={idsEnLista.has(s.id)}
          onAgregar={onAgregar}
          onEliminar={onEliminar}
          onBuscarPoster={onBuscarPoster}
        />
      ))}
    </ul>
  );
}
