import { useState } from "react";
import { Check, Trash } from "pixelarticons/react";
import Tapa from "./Tapa";

function Seccion({ titulo, items, vacio, children }) {
  return (
    <section className="panel">
      <h2 className="titulo">{titulo} ({items.length})</h2>
      {items.length === 0 ? <p className="vacio">{vacio}</p> : (
        <ul className="estante">{items.map(children)}</ul>
      )}
    </section>
  );
}

export default function MiLista({ items, onVista, onQuitar }) {
  const [reciente, setReciente] = useState(null);
  const porVer = items.filter((i) => i.estado === "porVer");
  const vistas = items.filter((i) => i.estado === "vista");

  const marcar = (i) => { setReciente(i.id); onVista(i); };

  return (
    <>
      <Seccion titulo="Por ver" items={porVer} vacio="No tenés series pendientes.">
        {(i) => (
          <li className="caratula" key={i.id}>
            <div className={`caratula-cuerpo ${i.poster ? "con-tapa" : ""}`}>
              <Tapa serie={i} className="tapa-mini" />
              <h3>{i.titulo}</h3>
            </div>
            <div className="acciones">
              <button className="btn primario" onClick={() => marcar(i)}>
                <Check className="icono" /> Marcar como vista
              </button>
              <button className="btn peligro" onClick={() => onQuitar(i)}>
                <Trash className="icono" /> Quitar
              </button>
            </div>
          </li>
        )}
      </Seccion>

      <Seccion titulo="Vistas" items={vistas} vacio="Todavía no marcaste ninguna como vista.">
        {(i) => (
          <li className="caratula" key={i.id}>
            <span className={`sello ${i.id === reciente ? "nuevo" : ""}`}>VISTA</span>
            <div className={`caratula-cuerpo ${i.poster ? "con-tapa" : ""}`}>
              <Tapa serie={i} className="tapa-mini" />
              <h3>{i.titulo}</h3>
            </div>
            <div className="acciones">
              <button className="btn peligro" onClick={() => onQuitar(i)}>
                <Trash className="icono" /> Quitar
              </button>
            </div>
          </li>
        )}
      </Seccion>
    </>
  );
}
