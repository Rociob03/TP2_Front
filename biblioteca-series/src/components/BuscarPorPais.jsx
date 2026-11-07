import { useEffect, useState } from "react";
import { paises, porPais } from "../services/tmdb";
import PosterTmdb from "./PosterTmdb";

// Accesos rápidos a los países más buscados
const RAPIDOS = [
  ["AR", "Argentina"], ["ES", "España"], ["MX", "México"], ["KR", "Corea del Sur"],
  ["JP", "Japón"], ["FR", "Francia"], ["GB", "Reino Unido"], ["US", "Estados Unidos"],
];

// Películas y series según su país de origen (TMDB)
export default function BuscarPorPais({ enMiLista, onGuardarTmdb, onAbrirFicha }) {
  const [lista, setLista] = useState([]);
  const [pais, setPais] = useState("");
  const [tipo, setTipo] = useState("movie");
  const [pagina, setPagina] = useState(1);
  const [titulos, setTitulos] = useState([]);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(null);

  // Lista completa de países para el desplegable
  useEffect(() => {
    paises().then(setLista).catch(() => setLista([]));
  }, []);

  // Cada vez que cambia el país, el tipo o la página, se piden los títulos
  useEffect(() => {
    if (!pais) return;
    let vigente = true;
    setCargando(true);
    setError("");
    porPais(pais, tipo, pagina)
      .then(({ items, hayMas }) => {
        if (!vigente) return;
        setTitulos((prev) => (pagina === 1 ? items : [...prev, ...items]));
        setHayMas(hayMas);
      })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [pais, tipo, pagina]);

  const elegirPais = (codigo) => { setPais(codigo); setPagina(1); setTitulos([]); };
  const elegirTipo = (t) => { setTipo(t); setPagina(1); setTitulos([]); };

  const guardar = async (item) => {
    setGuardando(item.tmdbId);
    try { await onGuardarTmdb(item); } finally { setGuardando(null); }
  };

  const nombrePais =
    lista.find((p) => p.codigo === pais)?.nombre || RAPIDOS.find(([c]) => c === pais)?.[1] || "";

  return (
    <div className="por-pais">
      <div className="ruleta-filtros" role="group" aria-label="Países más buscados">
        {RAPIDOS.map(([codigo, nombre]) => (
          <button
            key={codigo}
            type="button"
            className={`chip ${pais === codigo ? "activo" : ""}`}
            aria-pressed={pais === codigo}
            onClick={() => elegirPais(codigo)}
          >
            {nombre}
          </button>
        ))}
      </div>

      <div className="por-pais-controles">
        <label>
          <span className="etiqueta">O elegí cualquier país</span>
          <select value={pais} onChange={(e) => elegirPais(e.target.value)} disabled={lista.length === 0}>
            <option value="">{lista.length ? "País..." : "Cargando países..."}</option>
            {lista.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
          </select>
        </label>
        <div className="ruleta-filtros" role="group" aria-label="Tipo">
          <button type="button" className={`chip ${tipo === "movie" ? "activo" : ""}`} aria-pressed={tipo === "movie"} onClick={() => elegirTipo("movie")}>
            Películas
          </button>
          <button type="button" className={`chip ${tipo === "series" ? "activo" : ""}`} aria-pressed={tipo === "series"} onClick={() => elegirTipo("series")}>
            Series
          </button>
        </div>
      </div>

      {error && <p className="campo-error" role="alert">Error: {error}</p>}

      {pais && (
        <div className="filmografia">
          <div className="filmografia-cabecera">
            <p className="etiqueta">{tipo === "series" ? "Series" : "Películas"} más populares de</p>
            <h3>{nombrePais}</h3>
          </div>

          {titulos.length === 0 && cargando ? (
            <ul className="carrusel" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <li key={i} className="caratula poster fantasma" />)}
            </ul>
          ) : titulos.length === 0 && !error ? (
            <p className="vacio">No encontramos {tipo === "series" ? "series" : "películas"} de este país.</p>
          ) : (
            <ul className="carrusel">
              {titulos.map((item) => (
                <PosterTmdb
                  key={`${item.tipo}-${item.tmdbId}`}
                  item={item}
                  enMiLista={enMiLista(item)}
                  guardando={guardando === item.tmdbId}
                  onGuardar={guardar}
                  onAbrirFicha={onAbrirFicha}
                />
              ))}
              {hayMas && (
                <li className="ver-mas">
                  <button type="button" className="btn" onClick={() => setPagina((n) => n + 1)} disabled={cargando}>
                    {cargando ? "Cargando..." : "Ver más"}
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {!pais && <p className="ayuda">Elegí un país para ver sus películas y series más populares.</p>}
    </div>
  );
}
