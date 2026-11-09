import { Play } from "pixelarticons/react";
import TapaBoton from "./TapaBoton";
import BotonLista from "./BotonLista";

// Tarjeta de un título de TMDB (Estrenos, Tendencias, Mejor puntuadas, filmografías)
export default function PosterTmdb({ item, enMiLista, guardando, onGuardar, onAbrirFicha, onQuitarDeLista }) {
  return (
    <li className="caratula poster">
      <div className="caratula-lomo">
        <span className="etiqueta">{item.enCines ? "🎬 En cines" : item.anio || "—"}</span>
        <span className={`sticker ${item.tipo === "series" ? "v3" : "v1"}`}>
          {item.tipo === "series" ? "Serie" : "Película"}
        </span>
      </div>
      <TapaBoton serie={item} onAbrir={onAbrirFicha} generica />
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
        <BotonLista
          enLista={enMiLista}
          guardando={guardando}
          titulo={item.titulo}
          onGuardar={() => onGuardar(item)}
          onQuitar={() => onQuitarDeLista(item)}
        />
        <button className="btn" onClick={() => onAbrirFicha(item)}>
          <Play className="icono" /> {item.enCines ? "¿Dónde verla?" : "Ver tráiler"}
        </button>
      </div>
    </li>
  );
}
