import { Bookmark, Check, Play } from "pixelarticons/react";
import Tapa from "./Tapa";

// Tarjeta de un título de TMDB (Estrenos, Tendencias, Mejor puntuadas, filmografías)
export default function PosterTmdb({ item, enMiLista, guardando, onGuardar, onAbrirFicha }) {
  return (
    <li className="caratula poster">
      <div className="caratula-lomo">
        <span className="etiqueta">{item.enCines ? "🎬 En cines" : item.anio || "—"}</span>
        <span className={`sticker ${item.tipo === "series" ? "v3" : "v1"}`}>
          {item.tipo === "series" ? "Serie" : "Película"}
        </span>
      </div>
      <Tapa serie={item} generica />
      <div className="caratula-cuerpo">
        <h3>{item.titulo}</h3>
        {item.personaje ? (
          <p className="etiqueta">como {item.personaje}</p>
        ) : (
          item.genero && <p className="etiqueta">{item.genero}</p>
        )}
        {item.puntajeTmdb && <span className="puntaje">★ TMDB {item.puntajeTmdb}</span>}
      </div>
      <div className="acciones">
        <button className="btn primario" onClick={() => onGuardar(item)} disabled={enMiLista || guardando}>
          {enMiLista ? <Check className="icono" /> : <Bookmark className="icono" />}
          {enMiLista ? "En mi lista" : guardando ? "Guardando..." : "Guardar para ver"}
        </button>
        <button className="btn" onClick={() => onAbrirFicha(item)}>
          <Play className="icono" /> {item.enCines ? "¿Dónde verla?" : "Ver tráiler"}
        </button>
      </div>
    </li>
  );
}
