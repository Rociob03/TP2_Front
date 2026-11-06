import { useState } from "react";
import { Plus } from "pixelarticons/react";

export const PLATAFORMAS = [
  "Netflix", "Disney+", "HBO Max", "Prime Video", "Apple TV+",
  "Paramount+", "Flow", "Crunchyroll", "Mubi", "Otra",
];

const MAX = { titulo: 80, genero: 40 };
const VACIO = { titulo: "", genero: "", plataforma: "" };

function validar(v) {
  const e = {};
  const titulo = v.titulo.trim();
  const genero = v.genero.trim();
  if (!titulo) e.titulo = "El título es obligatorio.";
  else if (titulo.length > MAX.titulo) e.titulo = `Máximo ${MAX.titulo} caracteres.`;
  if (!genero) e.genero = "El género es obligatorio.";
  else if (genero.length > MAX.genero) e.genero = `Máximo ${MAX.genero} caracteres.`;
  if (!v.plataforma) e.plataforma = "Elegí una plataforma.";
  return e;
}

export default function SerieForm({ onAgregar }) {
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setValores({ ...valores, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    const errs = validar(valores);
    setErrores(errs);
    if (Object.keys(errs).length) return;

    setEnviando(true);
    const ok = await onAgregar({
      titulo: valores.titulo.trim(),
      genero: valores.genero.trim(),
      plataforma: valores.plataforma,
    });
    setEnviando(false);
    if (ok) setValores(VACIO);
  };

  return (
    <form className="panel form" onSubmit={enviar} noValidate>
      <h2 className="titulo">Agregar una serie</h2>

      <label>
        <span className="etiqueta">Título</span>
        <input name="titulo" value={valores.titulo} onChange={cambiar} maxLength={MAX.titulo + 20} />
        {errores.titulo && <small className="campo-error" role="alert">Error: {errores.titulo}</small>}
      </label>

      <label>
        <span className="etiqueta">Género</span>
        <input name="genero" value={valores.genero} onChange={cambiar} maxLength={MAX.genero + 20} />
        {errores.genero && <small className="campo-error">Error: {errores.genero}</small>}
      </label>

      <label>
        <span className="etiqueta">Disponible en (Argentina)</span>
        <select name="plataforma" value={valores.plataforma} onChange={cambiar}>
          <option value="">Elegí una plataforma</option>
          {PLATAFORMAS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {errores.plataforma && <small className="campo-error">Error: {errores.plataforma}</small>}
      </label>

      <button type="submit" className="btn primario" disabled={enviando}>
        <Plus className="icono" />
        {enviando ? "Guardando..." : "Agregar serie"}
      </button>
    </form>
  );
}
