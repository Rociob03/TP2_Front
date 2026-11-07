import { useEffect, useState } from "react";
import { Bookmark, Check } from "pixelarticons/react";
import { LISTAS_TMDB } from "../services/tmdb";
import { nombreTipo } from "../utils/tipo";
import { PLATAFORMAS } from "./SerieForm";
import Tapa from "./Tapa";

function Poster({ serie, enMiLista, onAgregar }) {
  const v = Math.max(0, PLATAFORMAS.indexOf(serie.plataforma)) % 4;
  return (
    <li className="caratula poster">
      <div className="caratula-lomo">
        <span className="etiqueta">{serie.vistas || 0} vistas</span>
        <span className={`sticker v${v} ${serie.plataforma === "Sin confirmar" ? "sin-confirmar" : ""}`}>{serie.plataforma === "Sin confirmar" ? "¿Dónde la veo?" : serie.plataforma}</span>
      </div>
      <Tapa serie={serie} generica />
      <div className="caratula-cuerpo">
        <h3>{serie.titulo}</h3>
        <p className="etiqueta">
          {[nombreTipo(serie.tipo), serie.genero].filter(Boolean).join(" · ")}
        </p>
        {serie.rating && <span className="puntaje">★ IMDb {serie.rating}</span>}
      </div>
      <div className="acciones">
        <button className="btn primario" onClick={() => onAgregar(serie)} disabled={enMiLista}>
          {enMiLista ? <Check className="icono" /> : <Bookmark className="icono" />}
          {enMiLista ? "En mi lista" : "Guardar para ver"}
        </button>
      </div>
    </li>
  );
}

// Cada fila es un estante del videoclub, con su cartel colgante
function Fila({ titulo, tono = 0, items, idsEnLista, onAgregar }) {
  if (items.length === 0) return null;
  return (
    <section className="fila gondola">
      <div className={`cartel-colgante c${tono}`}>
        <h2 className="titulo">{titulo}</h2>
      </div>
      <div className="gondola-estante">
        <ul className="carrusel">
          {items.map((s) => (
            <Poster key={s.id} serie={s} enMiLista={idsEnLista.has(s.id)} onAgregar={onAgregar} />
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------- Filas con datos reales de TMDB ----------

function PosterTmdb({ item, enMiLista, guardando, onGuardar }) {
  return (
    <li className="caratula poster">
      <div className="caratula-lomo">
        <span className="etiqueta">{item.anio || "—"}</span>
        <span className={`sticker ${item.tipo === "series" ? "v3" : "v1"}`}>
          {item.tipo === "series" ? "Serie" : "Película"}
        </span>
      </div>
      <Tapa serie={item} generica />
      <div className="caratula-cuerpo">
        <h3>{item.titulo}</h3>
        {item.genero && <p className="etiqueta">{item.genero}</p>}
        {item.puntajeTmdb && <span className="puntaje">★ TMDB {item.puntajeTmdb}</span>}
      </div>
      <div className="acciones">
        <button className="btn primario" onClick={() => onGuardar(item)} disabled={enMiLista || guardando}>
          {enMiLista ? <Check className="icono" /> : <Bookmark className="icono" />}
          {enMiLista ? "En mi lista" : guardando ? "Guardando..." : "Guardar para ver"}
        </button>
      </div>
    </li>
  );
}

// Tarjetas "fantasma" mientras carga la fila
function EstanteCargando() {
  return (
    <ul className="carrusel" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => <li key={i} className="caratula poster fantasma" />)}
    </ul>
  );
}

function FilaTmdb({ titulo, tono, lista, enMiLista, onGuardarTmdb }) {
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
      <img className="mascota" src="/img/mascota.png" alt=""
        onError={(e) => { e.currentTarget.style.display = "none"; }} />
      <div className="portada-texto">
        <p className="etiqueta">Películas · Series · Clásicos</p>
        <h2>BIENVENIDOS</h2>
        <p className="etiqueta">Tu próxima historia empieza acá</p>
        <a className="flecha" href="#filas" aria-label="Ver los títulos" />
      </div>
    </section>
  );
}

export default function Home({ series, miLista, idsEnLista, onAgregar, onIrABiblioteca, onGuardarTmdb }) {
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

  const props = { idsEnLista, onAgregar };

  // Un título de TMDB está "en mi lista" si su serie de la biblioteca está en la lista
  const enMiLista = (item) =>
    series.some(
      (s) =>
        idsEnLista.has(s.id) &&
        (s.tmdbId === item.tmdbId || s.titulo.trim().toLowerCase() === item.titulo.trim().toLowerCase())
    );
  const tmdb = { enMiLista, onGuardarTmdb };

  return (
    <>
      <Portada />
      <div id="filas">
        {/* Datos reales de TMDB */}
        <FilaTmdb titulo="Estrenos" tono={0} lista="estrenos" {...tmdb} />
        <FilaTmdb titulo="Tendencias de la semana" tono={2} lista="tendencias" {...tmdb} />

        {/* Datos propios de Reel Club (Firebase) */}
        {series.length === 0 ? (
          <div className="hero">
            <h2>El estante del club está vacío</h2>
            <p>Guardá algo de arriba o cargá tu primer título.</p>
            <button className="btn primario" onClick={onIrABiblioteca}>Agregar un título</button>
          </div>
        ) : (
          <>
            <Fila titulo="Más vistas en Reel Club" tono={1} items={masVistas} {...props} />
            <Fila titulo="Recomendadas para vos" tono={0} items={sugerencias} {...props} />
          </>
        )}

        <FilaTmdb titulo="Mejor puntuadas" tono={1} lista="mejorPuntuadas" {...tmdb} />

        <p className="credito-tmdb">
          Estrenos, tendencias y puntajes: datos e imágenes de{" "}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB</a>.
          Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
        </p>
      </div>
    </>
  );
}
