import { useEffect, useRef, useState } from "react";
import { Shuffle, Play, Reload } from "pixelarticons/react";
import TapaBoton from "./TapaBoton";

const FILTROS = [
  { id: "todo", texto: "Cualquiera" },
  { id: "movie", texto: "Película" },
  { id: "series", texto: "Serie" },
  { id: "favoritas", texto: "Mis favoritas" },
];

// ¿Qué veo hoy? Sortea algo de "Por ver" con una animación de tragamonedas
export default function QueVeoHoy({ items, onAbrirFicha }) {
  const [filtro, setFiltro] = useState("todo");
  const [mostrado, setMostrado] = useState(null);
  const [girando, setGirando] = useState(false);
  const [elegida, setElegida] = useState(null);
  const temporizadores = useRef([]);

  // Si se sale de la pantalla a mitad del giro, se cancelan los temporizadores
  useEffect(() => () => temporizadores.current.forEach(clearTimeout), []);

  const candidatas = items.filter((i) =>
    filtro === "todo" ? true : filtro === "favoritas" ? i.favorito : i.tipo === filtro
  );

  const sortear = () => {
    if (girando || candidatas.length === 0) return;
    const ganadora = candidatas[Math.floor(Math.random() * candidatas.length)];
    setElegida(null);

    // Sin animación si la persona pidió reducir movimiento
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || candidatas.length === 1) {
      setMostrado(ganadora);
      setElegida(ganadora);
      return;
    }

    setGirando(true);
    temporizadores.current.forEach(clearTimeout);
    temporizadores.current = [];
    const pasos = 18;
    let espera = 0;
    for (let n = 0; n < pasos; n++) {
      espera += 50 + n * n * 1.3; // cada vez más lento, como un rodillo que frena
      const ultima = n === pasos - 1;
      const item = ultima ? ganadora : candidatas[(n * 7 + 3) % candidatas.length];
      temporizadores.current.push(
        setTimeout(() => {
          setMostrado(item);
          if (ultima) {
            setGirando(false);
            setElegida(ganadora);
          }
        }, espera)
      );
    }
  };

  return (
    <section className="ruleta panel" aria-labelledby="ruleta-titulo">
      <div className="ruleta-cabecera">
        <h2 className="titulo" id="ruleta-titulo">¿Qué veo hoy?</h2>
        <p className="etiqueta">Dejá que el club elija por vos</p>
      </div>

      <div className="ruleta-filtros" role="group" aria-label="Qué sortear">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip ${filtro === f.id ? "activo" : ""}`}
            aria-pressed={filtro === f.id}
            onClick={() => { setFiltro(f.id); setElegida(null); setMostrado(null); }}
            disabled={girando}
          >
            {f.texto}
          </button>
        ))}
      </div>

      <div className={`ruleta-ventana ${girando ? "girando" : ""} ${elegida ? "ganadora" : ""}`} aria-live="polite">
        {mostrado ? (
          <span className="ruleta-titulo">{mostrado.titulo}</span>
        ) : (
          <span className="ruleta-titulo apagado">
            {candidatas.length ? "▶ PRESS PLAY" : "No hay nada para sortear con ese filtro"}
          </span>
        )}
      </div>

      {elegida && (
        <div className="ruleta-resultado">
          <TapaBoton serie={elegida} onAbrir={onAbrirFicha} className="tapa-mini" generica />
          <div>
            <p className="etiqueta">Esta noche toca...</p>
            <h3>{elegida.titulo}</h3>
            <div className="acciones">
              <button className="btn" onClick={() => onAbrirFicha(elegida)}>
                <Play className="icono" /> Ver ficha
              </button>
              <button className="btn" onClick={sortear}>
                <Reload className="icono" /> Otra
              </button>
            </div>
          </div>
        </div>
      )}

      {!elegida && (
        <button
          type="button"
          className="btn primario btn-grande ruleta-palanca"
          onClick={sortear}
          disabled={girando || candidatas.length === 0}
        >
          <Shuffle className="icono" /> {girando ? "Girando..." : "¡Sortear!"}
        </button>
      )}
    </section>
  );
}
