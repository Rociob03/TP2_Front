import { useEffect, useState } from "react";
import { Close } from "pixelarticons/react";
import BotonLista from "./BotonLista";
import { obtenerTrailer, proveedoresAR } from "../services/tmdb";
import { nombreTipo } from "../utils/tipo";
import Tapa from "./Tapa";
import CinesCercanos from "./CinesCercanos";

// Cadenas de cine de Argentina. No tienen API pública: se enlaza a su web oficial,
// donde están la cartelera, los horarios y las promociones vigentes.
const CADENAS = [
  { nombre: "Cinemark Hoyts", cartelera: "https://www.cinemarkhoyts.com.ar/", promos: "https://www.cinemarkhoyts.com.ar/promociones" },
  { nombre: "Cinépolis", cartelera: "https://www.cinepolis.com.ar/" },
  { nombre: "Showcase", cartelera: "https://www.todoshowcase.com/" },
  { nombre: "Atlas Cines", cartelera: "https://www.atlascines.com/" },
];

// Ficha de un título de TMDB: tráiler y, si está en cartelera, dónde verlo en cines
export default function FichaTmdb({ item, enMiLista, onGuardar, onQuitar, onCerrar }) {
  const [trailer, setTrailer] = useState(undefined); // undefined = cargando, null = no hay
  const [guardando, setGuardando] = useState(false);
  const [proveedores, setProveedores] = useState(undefined); // undefined = cargando, null = error

  useEffect(() => {
    let vigente = true;
    obtenerTrailer(item)
      .then((clave) => vigente && setTrailer(clave))
      .catch(() => vigente && setTrailer(null));
    return () => { vigente = false; };
  }, [item]);

  useEffect(() => {
    let vigente = true;
    proveedoresAR(item)
      .then((p) => vigente && setProveedores(p))
      .catch(() => vigente && setProveedores(null));
    return () => { vigente = false; };
  }, [item]);

  // Cerrar con Escape
  useEffect(() => {
    const alTeclear = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  const guardar = async () => {
    setGuardando(true);
    try { await onGuardar(item); } finally { setGuardando(false); }
  };

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div
        className="modal panel ficha"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn-icono ficha-cerrar" onClick={onCerrar} aria-label="Cerrar" autoFocus>
          <Close className="icono" />
        </button>

        <div className="ficha-cabecera">
          <Tapa serie={item} className="ficha-tapa" generica />
          <div className="ficha-datos">
            {item.enCines && <span className="cartel-cines">🎬 En cines</span>}
            <h2 className="titulo" id="ficha-titulo">{item.titulo}</h2>
            <p className="etiqueta">
              {[nombreTipo(item.tipo), item.anio, item.genero].filter(Boolean).join(" · ")}
            </p>
            {item.puntajeTmdb && <span className="puntaje">★ TMDB {item.puntajeTmdb}</span>}
            {item.ratingImdb && <span className="puntaje">★ IMDb {item.ratingImdb}</span>}
            {item.trama && <p className="trama">{item.trama}</p>}
            <BotonLista
              enLista={enMiLista}
              guardando={guardando}
              titulo={item.titulo}
              onGuardar={guardar}
              onQuitar={() => onQuitar(item)}
            />
          </div>
        </div>

        <section className="ficha-seccion">
          <h3>Dónde verla en streaming (Argentina)</h3>
          {proveedores === undefined ? (
            <p className="ayuda">Buscando plataformas...</p>
          ) : proveedores === null ? (
            <p className="campo-error">No pudimos consultar las plataformas. Probá más tarde.</p>
          ) : (
            <>
              {proveedores.streaming.length > 0 ? (
                <ul className="proveedores">
                  {proveedores.streaming.map((p) => (
                    <li key={p.nombre} className="proveedor">
                      {p.logo && <img src={p.logo} alt="" loading="lazy" />}
                      <span>{p.nombre}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="vacio">
                  {item.enCines
                    ? "Por ahora no está en ninguna plataforma: está en cines."
                    : "No está incluida en ninguna plataforma de streaming en Argentina."}
                </p>
              )}
              {(proveedores.alquiler.length > 0 || proveedores.compra.length > 0) && (
                <p className="ayuda">
                  Para alquilar o comprar en:{" "}
                  {[...new Set([...proveedores.alquiler, ...proveedores.compra].map((p) => p.nombre))].join(", ")}
                </p>
              )}
              {proveedores.link && (
                <a className="btn-texto" href={proveedores.link} target="_blank" rel="noreferrer">
                  Ver todas las opciones en TMDB
                </a>
              )}
              <p className="credito-tmdb">Datos de plataformas: JustWatch, a través de TMDB.</p>
            </>
          )}
        </section>

        <section className="ficha-seccion">
          <h3>Tráiler</h3>
          {trailer === undefined ? (
            <div className="ficha-video fantasma-video" aria-label="Cargando tráiler" />
          ) : trailer ? (
            <div className="ficha-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer}`}
                title={`Tráiler de ${item.titulo}`}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="vacio">No encontramos un tráiler para este título.</p>
          )}
        </section>

        {item.enCines && (
          <section className="ficha-seccion">
            <h3>¿Dónde verla en el cine?</h3>
            <p className="ayuda">
              Los horarios y las promos cambian todo el tiempo: consultalos en la web oficial de cada cadena.
            </p>
            <ul className="cadenas">
              {CADENAS.map((c) => (
                <li key={c.nombre} className="cadena">
                  <span className="cadena-nombre">{c.nombre}</span>
                  <span className="cadena-links">
                    <a className="btn" href={c.cartelera} target="_blank" rel="noreferrer">
                      {c.promos ? "Cartelera" : "Cartelera y promos"}
                    </a>
                    {c.promos && (
                      <a className="btn" href={c.promos} target="_blank" rel="noreferrer">Promos</a>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="ficha-subtitulo">Cines cerca tuyo</h3>
            <CinesCercanos />
          </section>
        )}
      </div>
    </div>
  );
}
