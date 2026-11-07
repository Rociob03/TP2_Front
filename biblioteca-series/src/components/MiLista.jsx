import { useState } from "react";
import { Check, Trash } from "pixelarticons/react";
import Tapa from "./Tapa";

const DURACION_RANURA = 750; // ms: lo que tarda la cinta en entrar por la ranura

// La fecha puede venir de Firestore (Timestamp) o ser una fecha local recién creada
function formatearFecha(fecha) {
  const f = fecha?.toDate ? fecha.toDate() : fecha instanceof Date ? fecha : null;
  return f ? f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "--/--/--";
}
const comoNumero = (fecha) => (fecha?.toMillis ? fecha.toMillis() : fecha instanceof Date ? fecha.getTime() : 0);

export default function MiLista({ items, onVista, onQuitar }) {
  const [reciente, setReciente] = useState(null);
  const [cayendo, setCayendo] = useState(null);

  const porVer = items.filter((i) => i.estado === "porVer");
  const vistas = items
    .filter((i) => i.estado === "vista")
    .sort((a, b) => comoNumero(b.fecha) - comoNumero(a.fecha));

  // Primero la animación de la ranura; después se guarda en Firebase
  const marcar = (i) => {
    if (cayendo) return;
    setCayendo(i.id);
    setTimeout(() => {
      setReciente(i.id);
      setCayendo(null);
      onVista(i);
    }, DURACION_RANURA);
  };

  return (
    <>
      {/* POR VER: las cintas esperan sobre el mostrador */}
      <section className="panel mostrador">
        <div className="mostrador-cabecera">
          <h2 className="titulo">Por ver ({porVer.length})</h2>
          <p className="etiqueta">Sobre el mostrador</p>
        </div>

        {porVer.length === 0 ? (
          <p className="vacio">No tenés nada pendiente. Guardá pelis o series desde el Inicio o la Biblioteca.</p>
        ) : (
          <ul className="estante">
            {porVer.map((i) => (
              <li className={`caratula cinta ${cayendo === i.id ? "a-la-ranura" : ""}`} key={i.id}>
                <div className="cinta-contenido">
                  <div className={`caratula-cuerpo ${i.poster ? "con-tapa" : ""}`}>
                    <Tapa serie={i} className="tapa-mini" />
                    <h3>{i.titulo}</h3>
                  </div>
                  <div className="acciones">
                    <button className="btn primario" onClick={() => marcar(i)} disabled={cayendo !== null}>
                      <Check className="icono" /> ¡Ya la vi!
                    </button>
                    <button className="btn peligro" onClick={() => onQuitar(i)} disabled={cayendo !== null}>
                      <Trash className="icono" /> Quitar
                    </button>
                  </div>
                </div>
                <span className="ranura" aria-hidden="true" />
              </li>
            ))}
          </ul>
        )}
        <div className="mostrador-frente" aria-hidden="true" />
      </section>

      {/* VISTAS: historial con formato de ticket de caja */}
      <section className="historial">
        <div className="recibo">
          <header className="recibo-cabecera">
            <p className="recibo-marca">REEL CLUB</p>
            <p className="etiqueta">Historial de vistas</p>
            <p className="ti-linea" aria-hidden="true">==============================</p>
          </header>

          {vistas.length === 0 ? (
            <p className="recibo-vacio">Todavía no marcaste ninguna como vista.</p>
          ) : (
            <ol className="recibo-lista">
              {vistas.map((i, n) => (
                <li className={`recibo-fila ${i.id === reciente ? "nueva" : ""}`} key={i.id}>
                  <span className="recibo-num">{String(n + 1).padStart(2, "0")}</span>
                  <Tapa serie={i} className="recibo-tapa" />
                  <span className="recibo-titulo">{i.titulo}</span>
                  <span className="recibo-fecha">{formatearFecha(i.fecha)}</span>
                  {i.id === reciente && <span className="sello mini nuevo">VISTA</span>}
                  <button
                    className="btn-icono recibo-quitar"
                    onClick={() => onQuitar(i)}
                    aria-label={`Quitar "${i.titulo}" del historial`}
                  >
                    <Trash className="icono" />
                  </button>
                </li>
              ))}
            </ol>
          )}

          <footer className="recibo-pie">
            <p className="ti-linea" aria-hidden="true">------------------------------</p>
            <p className="recibo-total"><span>TOTAL VISTAS</span><span>{vistas.length}</span></p>
            <div className="codigo-barras" aria-hidden="true" />
            <p className="ti-gracias">¡Gracias por ser parte del club!</p>
          </footer>
        </div>
      </section>
    </>
  );
}
