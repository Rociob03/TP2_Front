import { useEffect, useState } from "react";
import { Play } from "pixelarticons/react";
import TapaBoton from "./TapaBoton";
import BotonLista from "./BotonLista";
import { LISTAS_TMDB } from "../services/tmdb";
import { nombreTipo } from "../utils/tipo";
import StickerPlataforma from "./StickerPlataforma";
import PosterTmdb from "./PosterTmdb";
import { PLATAFORMAS } from "./SerieForm";

function Poster({ serie, enMiLista, onAgregar, onAbrirFichaSerie, onQuitarDeLista }) {
  const v = Math.max(0, PLATAFORMAS.indexOf(serie.plataforma)) % 4;
  return (
    <li className="caratula poster">
      <div className="caratula-lomo">
        <span className="etiqueta">{serie.vistas || 0} vistas</span>
        <StickerPlataforma serie={serie} variante={v} onAbrirFicha={onAbrirFichaSerie} />
      </div>
      <TapaBoton serie={serie} onAbrir={onAbrirFichaSerie} generica />
      <div className="caratula-cuerpo">
        <h3>{serie.titulo}</h3>
        <p className="etiqueta">
          {[nombreTipo(serie.tipo), serie.genero].filter(Boolean).join(" · ")}
        </p>
        {serie.rating && <span className="puntaje">★ IMDb {serie.rating}</span>}
      </div>
      <div className="acciones">
        <BotonLista
          enLista={enMiLista}
          titulo={serie.titulo}
          onGuardar={() => onAgregar(serie)}
          onQuitar={() => onQuitarDeLista(serie)}
        />
        <button className="btn" onClick={() => onAbrirFichaSerie(serie)}>
          <Play className="icono" /> Ver ficha
        </button>
      </div>
    </li>
  );
}

// Cada fila es un estante del videoclub, con su cartel colgante
function Fila({ titulo, tono = 0, items, idsEnLista, onAgregar, onAbrirFichaSerie, onQuitarDeLista }) {
  if (items.length === 0) return null;
  return (
    <section className="fila gondola">
      <div className={`cartel-colgante c${tono}`}>
        <h2 className="titulo">{titulo}</h2>
      </div>
      <div className="gondola-estante">
        <ul className="carrusel">
          {items.map((s) => (
            <Poster key={s.id} serie={s} enMiLista={idsEnLista.has(s.id)} onAgregar={onAgregar} onAbrirFichaSerie={onAbrirFichaSerie} onQuitarDeLista={onQuitarDeLista} />
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------- Filas con datos reales de TMDB ----------


// Tarjetas "fantasma" mientras carga la fila
function EstanteCargando() {
  return (
    <ul className="carrusel" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => <li key={i} className="caratula poster fantasma" />)}
    </ul>
  );
}

function FilaTmdb({ titulo, tono, lista, enMiLista, onGuardarTmdb, onAbrirFicha, onQuitarDeLista }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setError("");
    LISTAS_TMDB[lista]()
      .then((datos) => vigente && setItems(datos))
      .catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [lista, intento]);

  const guardar = async (item) => {
    setGuardando(item.tmdbId);
    try { await onGuardarTmdb(item); } finally { setGuardando(null); }
  };

  return (
    <section className="fila gondola">
      <div className={`cartel-colgante c${tono}`}>
        <h2 className="titulo">{titulo}</h2>
      </div>
      <div className="gondola-estante">
        {error ? (
          <div className="estante-error" role="alert">
            <p>Error: {error}</p>
            <button className="btn" onClick={() => { setItems(null); setIntento((n) => n + 1); }}>Reintentar</button>
          </div>
        ) : items === null ? (
          <EstanteCargando />
        ) : (
          <ul className="carrusel">
            {items.map((item) => (
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
        )}
      </div>
    </section>
  );
}

function Portada() {
  return (
    <section className="portada">
      <div className="sol" aria-hidden="true" />
      <div className="piso" aria-hidden="true" />
      <div className="portada-texto">
        <p className="etiqueta">Películas · Series · Clásicos</p>
        <h2>BIENVENIDOS</h2>
        <p className="etiqueta">Tu próxima historia empieza acá</p>
        <a className="flecha" href="#filas" aria-label="Ver los títulos" />
      </div>
    </section>
  );
}

export default function Home({ series, miLista, idsEnLista, onAgregar, onIrABiblioteca, onGuardarTmdb, enMiListaTmdb, onAbrirFicha, onAbrirFichaSerie, onQuitarDeLista }) {
  const masVistas = [...series].filter((s) => (s.vistas || 0) > 0)
    .sort((a, b) => b.vistas - a.vistas).slice(0, 12);

  // Sugerencias: series que no tenés, priorizando géneros de las que ya guardaste.
  // Una serie puede tener varios géneros ("Policial, Drama"), así que se separan.
  const separar = (genero = "") =>
    genero.toLowerCase().split(",").map((g) => g.trim()).filter(Boolean);
  const generos = new Set(
    miLista.flatMap((i) => separar(series.find((s) => s.id === i.id)?.genero))
  );
  const coincidencias = (s) => separar(s.genero).filter((g) => generos.has(g)).length;
  const sugerencias = series.filter((s) => !idsEnLista.has(s.id))
    .sort((a, b) =>
      (coincidencias(b) - coincidencias(a)) ||
      ((b.vistas || 0) - (a.vistas || 0)))
    .slice(0, 12);

  const props = { idsEnLista, onAgregar, onAbrirFichaSerie, onQuitarDeLista };

  // Favoritas del usuario (marcadas con ♥ en Mi lista)
  const favoritas = miLista
    .filter((i) => i.favorito)
    .map((i) => series.find((s) => s.id === i.id))
    .filter(Boolean);

  const tmdb = { enMiLista: enMiListaTmdb, onGuardarTmdb, onAbrirFicha, onQuitarDeLista };

  return (
    <>
      <Portada />
      <div id="filas">

        {/* Datos reales de TMDB */}
        <FilaTmdb titulo="Estrenos" tono={0} lista="estrenos" {...tmdb} />
        <FilaTmdb titulo="Tendencias de la semana" tono={2} lista="tendencias" {...tmdb} />

        {/* Datos propios de Reel Club (Firebase) */}
        <Fila titulo="Tus favoritas ♥" tono={2} items={favoritas} {...props} />
        {series.length === 0 ? (
          <div className="hero">
            <h2>El estante del club está vacío</h2>
            <p>Guardá algo de arriba o buscá tu primer título.</p>
            <button className="btn primario" onClick={onIrABiblioteca}>Buscar algo para ver</button>
          </div>
        ) : (
          <>
            <Fila titulo="Más vistas en Reel Club" tono={1} items={masVistas} {...props} />
            <Fila titulo="Recomendadas para vos" tono={0} items={sugerencias} {...props} />
          </>
        )}

        <FilaTmdb titulo="Mejor puntuadas" tono={1} lista="mejorPuntuadas" {...tmdb} />

      </div>
    </>
  );
}
