import SerieCard from "./SerieCard";

export default function SerieList({ series, uid, idsEnLista, onAgregar, onEliminar, onAbrirFicha, onQuitarDeLista }) {
  if (series.length === 0) {
    return <p className="vacio">Todavía nadie guardó nada. ¡Buscá algo y sé el primero!</p>;
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
          onAbrirFicha={onAbrirFicha}
          onQuitarDeLista={onQuitarDeLista}
        />
      ))}
    </ul>
  );
}
