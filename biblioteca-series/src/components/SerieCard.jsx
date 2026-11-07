import { Bookmark, Check, Trash, Play } from "pixelarticons/react";
import { PLATAFORMAS } from "./SerieForm";
import Tapa from "./Tapa";
import StickerPlataforma from "./StickerPlataforma";
import { nombreTipo } from "../utils/tipo";

export default function SerieCard({ serie, uid, enMiLista, onAgregar, onEliminar, onAbrirFicha }) {
  const esMia = serie.creadaPor === uid;
  const variante = Math.max(0, PLATAFORMAS.indexOf(serie.plataforma)) % 4;
  return (
    <li className="caratula">
      <div className="caratula-lomo">
        <span className="etiqueta">{nombreTipo(serie.tipo).toUpperCase() || "VHS"}</span>
        <StickerPlataforma serie={serie} variante={variante} onAbrirFicha={onAbrirFicha} />
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
          {enMiLista ? "En tu lista" : "Guardar para ver"}
        </button>
        <button className="btn" onClick={() => onAbrirFicha(serie)}>
          <Play className="icono" /> Ver ficha
        </button>
        {esMia && (
          <button className="btn peligro" onClick={() => onEliminar(serie)} title="Sacar del catálogo del club">
            <Trash className="icono" /> Sacar del club
          </button>
        )}
      </div>
    </li>
  );
}
