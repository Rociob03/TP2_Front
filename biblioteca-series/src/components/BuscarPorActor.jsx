import { useEffect, useState } from "react";
import { Search, Close } from "pixelarticons/react";
import { buscarPersonas, filmografia } from "../services/tmdb";
import PosterTmdb from "./PosterTmdb";

// Buscador de películas y series por actor o actriz (TMDB)
export default function BuscarPorActor({ enMiLista, onGuardarTmdb, onAbrirFicha, onQuitarDeLista }) {
  const [texto, setTexto] = useState("");
  const [personas, setPersonas] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState("");
  const [persona, setPersona] = useState(null);
  const [titulos, setTitulos] = useState(null);
  const [guardando, setGuardando] = useState(null);

  // Búsqueda mientras se escribe (espera una pausa)
  useEffect(() => {
    const q = texto.trim();
    setError("");
    setBuscado(false);
    if (q.length < 3 || (persona && q === persona.nombre)) {
      setPersonas([]);
      setBuscando(false);
      return;
    }
    const control = new AbortController();
    setBuscando(true);
    const espera = setTimeout(async () => {
      try {
        setPersonas(await buscarPersonas(q, control.signal));
        setBuscado(true);
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message);
      }
      setBuscando(false);
    }, 400);
    return () => { clearTimeout(espera); control.abort(); };
  }, [texto, persona]);

  // Al elegir a alguien, se trae su filmografía
  useEffect(() => {
    if (!persona) return;
    let vigente = true;
    setTitulos(null);
    filmografia(persona.id)
      .then((t) => vigente && setTitulos(t))
      .catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [persona]);

  const elegir = (p) => {
    setPersona(p);
    setTexto(p.nombre);
    setPersonas([]);
  };

  const limpiar = () => {
    setPersona(null);
    setTitulos(null);
    setTexto("");
    setError("");
  };

  const guardar = async (item) => {
    setGuardando(item.tmdbId);
    try { await onGuardarTmdb(item); } finally { setGuardando(null); }
  };

  return (
    <div className="por-actor">
      <label>
        <span className="etiqueta">Nombre del actor o la actriz</span>
        <span className="campo-con-icono">
          <Search className="icono" aria-hidden="true" />
          <input
            type="search"
            value={texto}
            onChange={(e) => { setTexto(e.target.value); if (persona) setPersona(null); }}
            placeholder="Ej: Ricardo Darín"
            autoComplete="off"
          />
        </span>
      </label>

      <p className="ayuda" aria-live="polite">
        {buscando
          ? "Buscando..."
          : buscado && personas.length === 0 && !persona
          ? "No encontramos a nadie con ese nombre."
          : !persona && texto.trim().length > 0 && texto.trim().length < 3
          ? "Escribí al menos 3 letras."
          : ""}
      </p>
      {error && <p className="campo-error" role="alert">Error: {error}</p>}

      {personas.length > 0 && (
        <ul className="personas">
          {personas.map((p) => (
            <li key={p.id}>
              <button type="button" className="persona" onClick={() => elegir(p)}>
                <span className="persona-inicial" aria-hidden="true">{p.nombre.charAt(0)}</span>
                <span>
                  <strong>{p.nombre}</strong>
                  {p.conocidoPor && <span className="etiqueta">{p.conocidoPor}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {persona && (
        <div className="filmografia">
          <div className="filmografia-cabecera">
            <p className="etiqueta">Películas y series con</p>
            <h3>{persona.nombre}</h3>
            <button type="button" className="btn-texto" onClick={limpiar}>
              <Close className="icono" /> Buscar a otra persona
            </button>
          </div>
          {titulos === null && !error ? (
            <ul className="carrusel" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <li key={i} className="caratula poster fantasma" />)}
            </ul>
          ) : titulos && titulos.length === 0 ? (
            <p className="vacio">No encontramos películas ni series con póster para esta persona.</p>
          ) : (
            titulos && (
              <ul className="carrusel">
                {titulos.map((item) => (
                  <PosterTmdb
                    key={`${item.tipo}-${item.tmdbId}`}
                    item={item}
                    enMiLista={enMiLista(item)}
                    guardando={guardando === item.tmdbId}
                    onGuardar={guardar}
                    onAbrirFicha={onAbrirFicha}
                    onQuitarDeLista={onQuitarDeLista}
                  />
                ))}
              </ul>
            )
          )}
        </div>
      )}
    </div>
  );
}
