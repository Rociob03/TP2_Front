import { useEffect, useState } from "react";
import { Plus, Search, Close } from "pixelarticons/react";
import { obtenerDetalle } from "../services/omdb";
import { buscarTitulosTmdb, datosParaGuardar, SIN_CONFIRMAR } from "../services/tmdb";
import { nombreTipo } from "../utils/tipo";

export const PLATAFORMAS = [
  "Netflix", "Disney+", "HBO Max", "Prime Video", "Apple TV+",
  "Paramount+", "Flow", "Crunchyroll", "Mubi", "Otra",
];

const MAX = { titulo: 80, genero: 40 };
const VACIO = { titulo: "", genero: "", plataforma: "" };
const MIN_BUSQUEDA = 2;

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

  // Buscador por título (TMDB: encuentra mientras se escribe, en español)
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [elegida, setElegida] = useState(null);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  // Plataforma detectada con TMDB: null | "buscando" | "detectada" | "sin-datos" | "error"
  const [deteccion, setDeteccion] = useState(null);

  // Busca mientras se escribe, esperando a que el usuario haga una pausa
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
        setResultados(await buscarTitulosTmdb(texto, control.signal));
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
      setDeteccion("buscando");
      // TMDB: plataforma en Argentina y código de IMDb; OMDb: puntaje de IMDb (si falla, se sigue igual)
      const { plataforma, imdbID } = await datosParaGuardar(resultado);
      const rating = imdbID ? await obtenerDetalle(imdbID).then((f) => f.rating).catch(() => "") : "";
      const ficha = {
        imdbID,
        tmdbId: resultado.tmdbId,
        titulo: resultado.titulo,
        anio: resultado.anio,
        tipo: resultado.tipo,
        genero: resultado.genero,
        poster: resultado.poster,
        trama: resultado.trama,
        rating,
      };
      setElegida(ficha);
      const sinDato = plataforma === SIN_CONFIRMAR;
      setValores((v) => ({
        ...v,
        titulo: ficha.titulo.slice(0, MAX.titulo),
        genero: ficha.genero.slice(0, MAX.genero),
        plataforma: sinDato ? "" : plataforma,
      }));
      setDeteccion(sinDato ? "sin-datos" : "detectada");
      setErrores({});
      setBusqueda("");
    } catch (e) {
      setErrorBusqueda(e.message);
      setDeteccion(null);
    } finally {
      setCargandoFicha(false);
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
    <form className="form" onSubmit={enviar} noValidate>

      <div className="buscador">
        <label>
          <span className="etiqueta">Buscar por título</span>
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
            ? "Trayendo los datos..."
            : buscando
            ? "Buscando..."
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
              <li key={`${r.tipo}-${r.tmdbId}`}>
                <button type="button" className="resultado" onClick={() => elegir(r)}>
                  {r.poster
                    ? <img src={r.poster} alt="" loading="lazy" />
                    : <span className="sin-tapa">SIN<br />TAPA</span>}
                  <span>
                    <strong>{r.titulo}</strong>
                    {r.tituloOriginal && r.tituloOriginal !== r.titulo && (
                      <span className="etiqueta titulo-original">{r.tituloOriginal}</span>
                    )}
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
              <p className="etiqueta">Elegida</p>
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
          {!deteccion && !elegida && "Opcional. Si elegís el título de la búsqueda, se completa sola."}
        </small>
      </label>

      <button type="submit" className="btn primario" disabled={enviando || cargandoFicha}>
        <Plus className="icono" />
        {enviando ? "Guardando..." : "Guardar para ver"}
      </button>
    </form>
  );
}
