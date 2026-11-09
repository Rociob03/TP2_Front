import { useState } from "react";
import { Check, Trash, Clock, Eye } from "pixelarticons/react";
import TapaBoton from "./TapaBoton";
import Estrellas from "./Estrellas";
import Corazon from "./Corazon";
import QueVeoHoy from "./QueVeoHoy";
import { nombreTipo } from "../utils/tipo";

const DURACION_RANURA = 750; // ms: lo que tarda la cinta en entrar por la ranura
const PAGINA_POR_VER = 10; // cuántas se muestran antes de "Ver más"
const PAGINA_VISTAS = 15;

// La fecha puede venir de Firestore (Timestamp) o ser una fecha local recién creada
function formatearFecha(fecha) {
  const f = fecha?.toDate ? fecha.toDate() : fecha instanceof Date ? fecha : null;
  return f ? f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "--/--/--";
}
const comoNumero = (fecha) => (fecha?.toMillis ? fecha.toMillis() : fecha instanceof Date ? fecha.getTime() : 0);

export default function MiLista({ items, onVista, onQuitar, onCalificar, onFavorito, onAbrirFicha }) {
  const [reciente, setReciente] = useState(null);
  const [cayendo, setCayendo] = useState(null);

  const porVer = items.filter((i) => i.estado === "porVer");
  const vistas = items
    .filter((i) => i.estado === "vista")
    .sort((a, b) => comoNumero(b.fecha) - comoNumero(a.fecha));

  const calificadas = vistas.filter((i) => i.calificacion);
  const promedio = calificadas.length
    ? calificadas.reduce((t, i) => t + i.calificacion, 0) / calificadas.length
    : 0;
  const favoritas = items.filter((i) => i.favorito).length;

  // Una sección a la vez (pestañas), para no tener que hacer tanto scroll en el celular
  const [pestana, setPestana] = useState(() => (porVer.length || !vistas.length ? "porVer" : "vistas"));
  const [cantPorVer, setCantPorVer] = useState(PAGINA_POR_VER);
  const [cantVistas, setCantVistas] = useState(PAGINA_VISTAS);

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
      <div className="pestanas mi-lista-pestanas" role="tablist" aria-label="Secciones de Mi lista">
        <span className={`pestanas-indicador ${pestana === "vistas" ? "derecha" : ""}`} aria-hidden="true" />
        <button type="button" role="tab" id="tab-porver" aria-controls="panel-mi-lista"
          aria-selected={pestana === "porVer"} onClick={() => setPestana("porVer")}>
          <Clock className="icono" /> Por ver ({porVer.length})
        </button>
        <button type="button" role="tab" id="tab-vistas" aria-controls="panel-mi-lista"
          aria-selected={pestana === "vistas"} onClick={() => setPestana("vistas")}>
          <Eye className="icono" /> Vistas ({vistas.length})
        </button>
      </div>

      <div id="panel-mi-lista" role="tabpanel" aria-labelledby={pestana === "porVer" ? "tab-porver" : "tab-vistas"}>
      {pestana === "porVer" && (
      <>
      {porVer.length > 0 && <QueVeoHoy items={porVer} onAbrirFicha={onAbrirFicha} />}

      {/* POR VER: las cintas esperan sobre el mostrador */}
      <section className="panel mostrador">
        <div className="mostrador-cabecera">
          <div className="cartel-colgante c2 cartel-neon">
            <h2 className="titulo">Por ver <span className="cartel-cuenta">{porVer.length}</span></h2>
          </div>
          <p className="etiqueta mostrador-cartel">Sobre el mostrador</p>
          <p className="nota-pegada" aria-hidden="true">Rebobiná antes de devolver ★</p>
        </div>

        {porVer.length === 0 ? (
          <p className="vacio">No tenés nada pendiente. Guardá pelis o series desde el Inicio o desde Buscar.</p>
        ) : (
          <ul className="estante">
            {porVer.slice(0, cantPorVer).map((i) => (
              <li className={`caratula cinta ${cayendo === i.id ? "a-la-ranura" : ""}`} key={i.id}>
                <div className="cinta-contenido">
                  <div className={`caratula-cuerpo ${i.poster ? "con-tapa" : ""}`}>
                    <TapaBoton serie={i} onAbrir={onAbrirFicha} className="tapa-mini" />
                    <div className="cinta-texto">
                      <h3>{i.titulo}</h3>
                      {nombreTipo(i.tipo) && <p className="etiqueta cinta-tipo">{nombreTipo(i.tipo)}</p>}
                    </div>
                  </div>
                  {/* Decoración: la ventanita con los carretes de la cinta VHS */}
                  <div className="cinta-ventana" aria-hidden="true">
                    <span className="carrete" />
                    <span className="cinta-magnetica" />
                    <span className="carrete" />
                  </div>
                  <div className="acciones">
                    <button className="btn primario" onClick={() => marcar(i)} disabled={cayendo !== null}>
                      <Check className="icono" />
                      <span className="texto-largo">¡Ya la vi!</span>
                      <span className="texto-corto">La vi</span>
                    </button>
                    <button className="btn peligro" onClick={() => onQuitar(i)} disabled={cayendo !== null}
                      aria-label={`Quitar "${i.titulo}" de tu lista`}>
                      <Trash className="icono" /> <span className="texto-largo">Quitar</span>
                    </button>
                    <Corazon activo={i.favorito} titulo={i.titulo} onCambiar={() => onFavorito(i)} />
                  </div>
                </div>
                <span className="ranura" aria-hidden="true" />
              </li>
            ))}
          </ul>
        )}
        {porVer.length > cantPorVer && (
          <button type="button" className="btn ver-mas-lista" onClick={() => setCantPorVer((n) => n + PAGINA_POR_VER)}>
            Ver más ({porVer.length - cantPorVer})
          </button>
        )}
        <div className="mostrador-frente" aria-hidden="true" />
      </section>
      </>
      )}

      {/* VISTAS: historial con formato de ticket de caja */}
      {pestana === "vistas" && (
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
              {vistas.slice(0, cantVistas).map((i, n) => (
                <li className={`recibo-fila ${i.id === reciente ? "nueva" : ""}`} key={i.id}>
                  <span className="recibo-num">{String(n + 1).padStart(2, "0")}</span>
                  <TapaBoton serie={i} onAbrir={onAbrirFicha} className="recibo-tapa" />
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
                  <div className="recibo-valoracion">
                    <Estrellas
                      valor={i.calificacion || 0}
                      titulo={i.titulo}
                      onCambiar={(v) => onCalificar(i, v)}
                    />
                    <Corazon activo={i.favorito} titulo={i.titulo} onCambiar={() => onFavorito(i)} />
                    {i.id === reciente && !i.calificacion && (
                      <span className="recibo-pista">¿Qué te pareció?</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {vistas.length > cantVistas && (
            <button type="button" className="btn-texto ver-mas-recibo" onClick={() => setCantVistas((n) => n + PAGINA_VISTAS)}>
              Ver más ({vistas.length - cantVistas})
            </button>
          )}

          <footer className="recibo-pie">
            <p className="ti-linea" aria-hidden="true">------------------------------</p>
            <p className="recibo-total"><span>TOTAL VISTAS</span><span>{vistas.length}</span></p>
            <p className="recibo-subtotal">
              <span>Tu promedio</span>
              <span>{promedio ? `★ ${promedio.toFixed(1)} (${calificadas.length})` : "—"}</span>
            </p>
            <p className="recibo-subtotal"><span>Favoritas</span><span>♥ {favoritas}</span></p>
            <div className="codigo-barras" aria-hidden="true" />
            <p className="ti-gracias">¡Gracias por ser parte del club!</p>
          </footer>
        </div>
      </section>
      )}
      </div>
    </>
  );
}
