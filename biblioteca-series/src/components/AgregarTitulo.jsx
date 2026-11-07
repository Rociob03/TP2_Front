import { useState } from "react";
import { Search, User, Globe } from "pixelarticons/react";
import SerieForm from "./SerieForm";
import BuscarPorActor from "./BuscarPorActor";
import BuscarPorPais from "./BuscarPorPais";

// Panel "Buscá qué ver": por título (IMDb), por actor/actriz o por país (TMDB). Todo termina en "Guardar para ver".
const MODOS = ["titulo", "actor", "pais"];

export default function AgregarTitulo({ onAgregar, enMiLista, onGuardarTmdb, onAbrirFicha }) {
  const [modo, setModo] = useState("titulo");
  const tmdb = { enMiLista, onGuardarTmdb, onAbrirFicha };

  return (
    <section className="panel agregar" aria-labelledby="agregar-titulo">
      <h2 className="titulo" id="agregar-titulo">Buscá qué ver</h2>
      <p className="ayuda">Encontrá una película o serie y guardala en tu lista.</p>

      <div className="pestanas tres" role="tablist" aria-label="Cómo querés buscar">
        <span className={`pestanas-indicador pos-${MODOS.indexOf(modo)}`} aria-hidden="true" />
        <button type="button" role="tab" id="tab-titulo" aria-controls="panel-busqueda"
          aria-selected={modo === "titulo"} onClick={() => setModo("titulo")}>
          <Search className="icono" /> Por título
        </button>
        <button type="button" role="tab" id="tab-actor" aria-controls="panel-busqueda"
          aria-selected={modo === "actor"} onClick={() => setModo("actor")}>
          <User className="icono" /> Por actor
        </button>
        <button type="button" role="tab" id="tab-pais" aria-controls="panel-busqueda"
          aria-selected={modo === "pais"} onClick={() => setModo("pais")}>
          <Globe className="icono" /> Por país
        </button>
      </div>

      <div id="panel-busqueda" role="tabpanel" aria-labelledby={`tab-${modo}`}>
        {modo === "titulo" && <SerieForm onAgregar={onAgregar} />}
        {modo === "actor" && <BuscarPorActor {...tmdb} />}
        {modo === "pais" && <BuscarPorPais {...tmdb} />}
      </div>
    </section>
  );
}
