import { useEffect, useState } from "react";
import { Plus, Search, Close } from "pixelarticons/react";
import { buscarTitulos, obtenerDetalle } from "../services/omdb";
import { plataformaPorImdb, SIN_CONFIRMAR } from "../services/tmdb";
import { nombreTipo } from "../utils/tipo";

export const PLATAFORMAS = [
  "Netflix", "Disney+", "HBO Max", "Prime Video", "Apple TV+",
  "Paramount+", "Flow", "Crunchyroll", "Mubi", "Otra",
];

const MAX = { titulo: 80, genero: 40 };
const VACIO = { titulo: "", genero: "", plataforma: "" };
const MIN_BUSQUEDA = 3;

function validar(v) {
  const e = {};
  const titulo = v.titulo.trim();
  const genero = v.genero.trim();
  if (!titulo) e.titulo = "El título es obligatorio.";
  else if (titulo.length > MAX.titulo) e.titulo = `Máximo ${MAX.titulo} caracteres.`;
  if (!genero) e.genero = "El género es obligatorio.";
  else if (genero.length > MAX.genero) e.genero = `Máximo ${MAX.genero} caracteres.`;
  return e;
}

export default function SerieForm({ onAgregar }) {
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  // Buscador de IMDb (OMDb)
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [elegida, setElegida] = useState(null);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  // Plataforma detectada con TMDB: null | "buscando" | "detectada" | "sin-datos" | "error"
  const [deteccion, setDeteccion] = useState(null);

  // Busca en IMDb mientras se escribe, esperando a que el usuario haga una pausa
  useEffect(() => {
    const texto = busqueda.trim();
    setErrorBusqueda("");
    setBuscado(false);
    if (texto.length < MIN_BUSQUEDA) {
      setResultados([]);
      setBuscando(false);
      return;
    }

    const control = new AbortController();
    setBuscando(true);
    const espera = setTimeout(async () => {
      try {
        setResultados(await buscarTitulos(texto, control.signal));
        setBuscado(true);
      } catch (e) {
        if (e.name === "AbortError") return;
        setResultados([]);
        setErrorBusqueda(e.message);
      }
      setBuscando(false);
    }, 450);

    return () => { clearTimeout(espera); control.abort(); };
  }, [busqueda]);

  // Al elegir un resultado, se trae la ficha completa y se completa el formulario
  const elegir = async (resultado) => {
    setCargandoFicha(true);
    setErrorBusqueda("");
    try {
      const ficha = await obtenerDetalle(resultado.imdbID);
      setElegida(ficha);
      setValores((v) => ({
        ...v,
        titulo: ficha.titulo.slice(0, MAX.titulo),
        genero: ficha.genero.slice(0, MAX.genero),
      }));
      setErrores({});
      setBusqueda("");
      detectarPlataforma(ficha.imdbID);
    } catch (e) {
      setErrorBusqueda(e.message);
    } finally {
      setCargandoFicha(false);
    }
  };

  // Busca en TMDB dónde se puede ver en Argentina y completa el campo solo
  const detectarPlataforma = async (imdbID) => {
    setDeteccion("buscando");
    try {
      const { plataforma, tmdbId } = await plataformaPorImdb(imdbID);
      setElegida((f) => (f && f.imdbID === imdbID ? { ...f, tmdbId } : f));
      if (plataforma === SIN_CONFIRMAR) {
        setValores((v) => ({ ...v, plataforma: "" }));
        setDeteccion("sin-datos");
      } else {
        setValores((v) => ({ ...v, plataforma }));
        setDeteccion("detectada");
      }
    } catch {
      setDeteccion("error");
    }
  };

  const quitarElegida = () => {
    setElegida(null);
    setDeteccion(null);
    setValores((v) => ({ ...v, titulo: "", genero: "" }));
  };

  const cambiar = (e) => {
    setValores({ ...valores, [e.target.name]: e.target.value });
    if (e.target.name === "plataforma") setDeteccion(null); // la eligió a mano
  };

  const enviar = async (e) => {
    e.preventDefault();
    const errs = validar(valores);
    setErrores(errs);
    if (Object.keys(errs).length) return;

    setEnviando(true);
    const ok = await onAgregar({
      titulo: valores.titulo.trim(),
      genero: valores.genero.trim(),
      plataforma: valores.plataforma || SIN_CONFIRMAR,
      imdb: elegida,
      tmdbId: elegida?.tmdbId || null,
    });
    setEnviando(false);
    if (ok) {
      setValores(VACIO);
      setElegida(null);
      setDeteccion(null);
    }
  };

  const textoBuscado = busqueda.trim();

  return (
    <form className="panel form" onSubmit={enviar} noValidate>
      <h2 className="titulo">Agregar a la biblioteca</h2>

      <div className="buscador">
        <label>
          <span className="etiqueta">Buscar en IMDb</span>
          <span className="campo-con-icono">
            <Search className="icono" aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: Breaking Bad"
              autoComplete="off"
              aria-describedby="ayuda-imdb"
            />
          </span>
        </label>

        <p className="ayuda" id="ayuda-imdb" aria-live="polite">
          {cargandoFicha
            ? "Trayendo la ficha de IMDb..."
            : buscando
            ? "Buscando en IMDb..."
            : textoBuscado.length > 0 && textoBuscado.length < MIN_BUSQUEDA
            ? `Escribí al menos ${MIN_BUSQUEDA} letras.`
            : buscado && resultados.length === 0
            ? "No encontramos nada con ese nombre. Podés cargarla a mano abajo."
            : !elegida && "Elegí un resultado para completar los datos y sumar el póster, o cargala a mano."}
        </p>

        {errorBusqueda && <p className="campo-error" role="alert">Error: {errorBusqueda}</p>}

        {resultados.length > 0 && !cargandoFicha && (
          <ul className="resultados">
            {resultados.map((r) => (
              <li key={r.imdbID}>
                <button type="button" className="resultado" onClick={() => elegir(r)}>
                  {r.poster
                    ? <img src={r.poster} alt="" loading="lazy" />
                    : <span className="sin-tapa">SIN<br />TAPA</span>}
                  <span>
                    <strong>{r.titulo}</strong>
                    <span className="etiqueta">{r.anio} · {r.tipo === "series" ? "Serie" : "Película"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {elegida && (
          <div className="elegida">
            {elegida.poster
              ? <img src={elegida.poster} alt={`Póster de ${elegida.titulo}`} />
              : <span className="sin-tapa">SIN<br />TAPA</span>}
            <div className="elegida-datos">
              <p className="etiqueta">Elegida de IMDb</p>
              <h3>{elegida.titulo}</h3>
              <p className="etiqueta">
                {[nombreTipo(elegida.tipo), elegida.anio].filter(Boolean).join(" · ")}{elegida.rating && <> · <span className="puntaje">★ {elegida.rating}</span></>}
              </p>
              {elegida.trama && <p className="trama">{elegida.trama}</p>}
            </div>
            <button type="button" className="btn-icono" onClick={quitarElegida} aria-label="Quitar el título elegido">
              <Close className="icono" />
            </button>
          </div>
        )}
      </div>

      <label>
        <span className="etiqueta">Título</span>
        <input name="titulo" value={valores.titulo} onChange={cambiar} maxLength={MAX.titulo + 20} />
        {errores.titulo && <small className="campo-error" role="alert">Error: {errores.titulo}</small>}
      </label>

      <label>
        <span className="etiqueta">Género</span>
        <input name="genero" value={valores.genero} onChange={cambiar} maxLength={MAX.genero + 20} />
        {errores.genero && <small className="campo-error">Error: {errores.genero}</small>}
      </label>

      <label>
        <span className="etiqueta">Disponible en (Argentina)</span>
        <select name="plataforma" value={valores.plataforma} onChange={cambiar} disabled={deteccion === "buscando"}>
          <option value="">No sé (queda sin confirmar)</option>
          {PLATAFORMAS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <small className={`plataforma-aviso ${deteccion || ""}`} aria-live="polite">
          {deteccion === "buscando" && "Buscando en qué plataforma está..."}
          {deteccion === "detectada" && `Detectada automáticamente: ${valores.plataforma} (Argentina). Podés cambiarla.`}
          {deteccion === "sin-datos" && "No la encontramos en plataformas de Argentina. Si sabés dónde está, elegila; si no, dejá \"No sé\"."}
          {deteccion === "error" && "No pudimos detectar la plataforma. Elegila a mano o dejá \"No sé\"."}
          {!deteccion && !elegida && "Opcional. Si la elegís desde IMDb, se completa sola."}
        </small>
      </label>

      <button type="submit" className="btn primario" disabled={enviando || cargandoFicha}>
        <Plus className="icono" />
        {enviando ? "Guardando..." : `Agregar ${nombreTipo(elegida?.tipo).toLowerCase() || "título"}`}
      </button>
    </form>
  );
}
