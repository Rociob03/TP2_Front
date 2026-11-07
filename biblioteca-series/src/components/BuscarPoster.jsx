import { useEffect, useRef, useState } from "react";
import { Search, Close } from "pixelarticons/react";
import { buscarTitulos, obtenerDetalle } from "../services/omdb";

// Ventana para elegir en IMDb el póster correcto de una serie cargada a mano
export default function BuscarPoster({ serie, onElegir, onCerrar }) {
  // Se arranca con el título de la serie, sin el año entre paréntesis
  const [texto, setTexto] = useState(serie.titulo.replace(/\(\d{4}\)/, "").trim());
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [guardando, setGuardando] = useState(null);
  const [error, setError] = useState("");
  const campo = useRef(null);

  // Foco en el buscador y cierre con Escape
  useEffect(() => {
    campo.current?.focus();
    campo.current?.select();
    const alTeclear = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  // Búsqueda en IMDb mientras se escribe
  useEffect(() => {
    const q = texto.trim();
    setError("");
    setBuscado(false);
    if (q.length < 3) { setResultados([]); setBuscando(false); return; }

    const control = new AbortController();
    setBuscando(true);
    const espera = setTimeout(async () => {
      try {
        setResultados(await buscarTitulos(q, control.signal));
        setBuscado(true);
      } catch (e) {
        if (e.name === "AbortError") return;
        setResultados([]);
        setError(e.message);
      }
      setBuscando(false);
    }, 400);
    return () => { clearTimeout(espera); control.abort(); };
  }, [texto]);

  const elegir = async (r) => {
    setGuardando(r.imdbID);
    setError("");
    try {
      const ficha = await obtenerDetalle(r.imdbID);
      const ok = await onElegir(serie, ficha);
      if (ok) onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-poster"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-cabecera">
          <div>
            <p className="etiqueta">Buscar póster para</p>
            <h2 className="titulo" id="titulo-poster">{serie.titulo}</h2>
          </div>
          <button className="btn-icono" onClick={onCerrar} aria-label="Cerrar">
            <Close className="icono" />
          </button>
        </div>

        <label>
          <span className="etiqueta">Título en IMDb (probá con el nombre original en inglés)</span>
          <span className="campo-con-icono">
            <Search className="icono" aria-hidden="true" />
            <input
              ref={campo}
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej: The Dark Knight"
              autoComplete="off"
            />
          </span>
        </label>

        <p className="ayuda" aria-live="polite">
          {buscando
            ? "Buscando en IMDb..."
            : texto.trim().length < 3
            ? "Escribí al menos 3 letras."
            : buscado && resultados.length === 0
            ? "No hay resultados. Probá con otro nombre (por ejemplo, en inglés)."
            : resultados.length > 0 && "Elegí el correcto:"}
        </p>
        {error && <p className="campo-error" role="alert">Error: {error}</p>}

        {resultados.length > 0 && (
          <ul className="resultados">
            {resultados.map((r) => (
              <li key={r.imdbID}>
                <button
                  type="button"
                  className="resultado"
                  onClick={() => elegir(r)}
                  disabled={guardando !== null}
                >
                  {r.poster
                    ? <img src={r.poster} alt="" loading="lazy" />
                    : <span className="sin-tapa">SIN<br />TAPA</span>}
                  <span>
                    <strong>{r.titulo}</strong>
                    <span className="etiqueta">
                      {guardando === r.imdbID
                        ? "Guardando..."
                        : `${r.anio} · ${r.tipo === "series" ? "Serie" : "Película"}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
