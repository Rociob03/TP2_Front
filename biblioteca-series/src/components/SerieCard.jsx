import { Bookmark, Check, Trash } from "pixelarticons/react";
import { PLATAFORMAS } from "./SerieForm";
import Tapa from "./Tapa";

export default function SerieCard({ serie, uid, enMiLista, onAgregar, onEliminar }) {
  const esMia = serie.creadaPor === uid;
  const variante = Math.max(0, PLATAFORMAS.indexOf(serie.plataforma)) % 4;
  return (
    <li className="caratula">
      <div className="caratula-lomo">
        <span className="etiqueta">VHS</span>
        <span className={`sticker v${variante}`}>{serie.plataforma}</span>
      </div>
      <div className={`caratula-cuerpo ${serie.poster ? "con-tapa" : ""}`}>
        <Tapa serie={serie} className="tapa-mini" />
        <div className="caratula-texto">
          <h3>{serie.titulo}</h3>
          <p className="etiqueta">{serie.genero}{serie.anio && ` · ${serie.anio}`}</p>
          {serie.rating && <span className="puntaje">★ IMDb {serie.rating}</span>}
          {esMia && <p className="etiqueta tuya">Cargada por vos</p>}
        </div>
      </div>
      <div className="acciones">
        <button className="btn primario" onClick={() => onAgregar(serie)} disabled={enMiLista}>
          {enMiLista ? <Check className="icono" /> : <Bookmark className="icono" />}
          {enMiLista ? "En mi lista" : "Por ver"}
        </button>
        {esMia && (
          <button className="btn peligro" onClick={() => onEliminar(serie)}>
            <Trash className="icono" /> Eliminar
          </button>
        )}
      </div>
    </li>
  );
}
