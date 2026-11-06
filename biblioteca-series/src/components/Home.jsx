import { Bookmark, Check } from "pixelarticons/react";
import { PLATAFORMAS } from "./SerieForm";
import Tapa from "./Tapa";

function Poster({ serie, enMiLista, onAgregar }) {
  const v = Math.max(0, PLATAFORMAS.indexOf(serie.plataforma)) % 4;
  return (
    <li className="caratula poster">
      <div className="caratula-lomo">
        <span className="etiqueta">{serie.vistas || 0} vistas</span>
        <span className={`sticker v${v}`}>{serie.plataforma}</span>
      </div>
      <Tapa serie={serie} />
      <div className="caratula-cuerpo">
        <h3>{serie.titulo}</h3>
        <p className="etiqueta">{serie.genero}</p>
        {serie.rating && <span className="puntaje">★ IMDb {serie.rating}</span>}
      </div>
      <div className="acciones">
        <button className="btn primario" onClick={() => onAgregar(serie)} disabled={enMiLista}>
          {enMiLista ? <Check className="icono" /> : <Bookmark className="icono" />}
          {enMiLista ? "En mi lista" : "Por ver"}
        </button>
      </div>
    </li>
  );
}

function Fila({ titulo, items, idsEnLista, onAgregar }) {
  if (items.length === 0) return null;
  return (
    <section className="fila">
      <h2 className="titulo">{titulo}</h2>
      <ul className="carrusel">
        {items.map((s) => (
          <Poster key={s.id} serie={s} enMiLista={idsEnLista.has(s.id)} onAgregar={onAgregar} />
        ))}
      </ul>
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
        <a className="flecha" href="#filas" aria-label="Ver las series" />
      </div>
    </section>
  );
}

export default function Home({ series, miLista, idsEnLista, onAgregar, onIrABiblioteca }) {
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

  return (
    <>
      <Portada />
      <div id="filas">
        {series.length === 0 ? (
          <div className="hero">
            <h2>Estante vacío</h2>
            <p>Todavía no hay series. ¡Cargá la primera!</p>
            <button className="btn primario" onClick={onIrABiblioteca}>Agregar una serie</button>
          </div>
        ) : (
          <>
            <Fila titulo="Más vistas" items={masVistas} {...props} />
            <Fila titulo="Sugerencias para vos" items={sugerencias} {...props} />
            <Fila titulo="Recién agregadas" items={series.slice(0, 12)} {...props} />
          </>
        )}
      </div>
    </>
  );
}
