import { useMemo, useState } from "react";
import { Search, Close } from "pixelarticons/react";
import SerieList from "./SerieList";

// Para buscar sin importar mayúsculas ni tildes ("accion" encuentra "Acción")
const normalizar = (t = "") => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const separarGeneros = (g = "") => g.split(",").map((x) => x.trim()).filter(Boolean);

const ORDENES = {
  recientes: { texto: "Agregadas recientemente", fn: null }, // así vienen de Firebase
  az: { texto: "Título (A–Z)", fn: (a, b) => a.titulo.localeCompare(b.titulo, "es") },
  vistas: { texto: "Más vistas en el club", fn: (a, b) => (b.vistas || 0) - (a.vistas || 0) },
  imdb: { texto: "Mejor puntaje IMDb", fn: (a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0) },
};

const VACIO = { texto: "", tipo: "", genero: "", plataforma: "", mias: false, orden: "recientes" };

export default function BibliotecaFiltrada({ series, uid, ...props }) {
  const [f, setF] = useState(VACIO);
  const cambiar = (campo) => (e) =>
    setF({ ...f, [campo]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  // Opciones de los desplegables, a partir de lo que hay en el catálogo
  const generos = useMemo(
    () => [...new Set(series.flatMap((s) => separarGeneros(s.genero)))].sort((a, b) => a.localeCompare(b, "es")),
    [series]
  );
  const plataformas = useMemo(
    () => [...new Set(series.map((s) => s.plataforma).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [series]
  );

  const filtradas = useMemo(() => {
    const q = normalizar(f.texto);
    const lista = series.filter(
      (s) =>
        (!q || normalizar(s.titulo).includes(q)) &&
        (!f.tipo || s.tipo === f.tipo) &&
        (!f.genero || separarGeneros(s.genero).includes(f.genero)) &&
        (!f.plataforma || s.plataforma === f.plataforma) &&
        (!f.mias || s.creadaPor === uid)
    );
    const orden = ORDENES[f.orden].fn;
    return orden ? [...lista].sort(orden) : lista;
  }, [series, f, uid]);

  const hayFiltros = f.texto || f.tipo || f.genero || f.plataforma || f.mias;

  return (
    <>
      <div className="filtros panel" role="search">
        <label className="filtro-busqueda">
          <span className="etiqueta">Buscar entre lo que guardaron los socios</span>
          <span className="campo-con-icono">
            <Search className="icono" aria-hidden="true" />
            <input type="search" value={f.texto} onChange={cambiar("texto")} placeholder="Título..." autoComplete="off" />
          </span>
        </label>

        <label>
          <span className="etiqueta">Tipo</span>
          <select value={f.tipo} onChange={cambiar("tipo")}>
            <option value="">Todo</option>
            <option value="movie">Películas</option>
            <option value="series">Series</option>
          </select>
        </label>

        <label>
          <span className="etiqueta">Género</span>
          <select value={f.genero} onChange={cambiar("genero")}>
            <option value="">Todos</option>
            {generos.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>

        <label>
          <span className="etiqueta">Plataforma</span>
          <select value={f.plataforma} onChange={cambiar("plataforma")}>
            <option value="">Todas</option>
            {plataformas.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>

        <label>
          <span className="etiqueta">Ordenar por</span>
          <select value={f.orden} onChange={cambiar("orden")}>
            {Object.entries(ORDENES).map(([id, o]) => <option key={id} value={id}>{o.texto}</option>)}
          </select>
        </label>

        <label className="filtro-check">
          <input type="checkbox" checked={f.mias} onChange={cambiar("mias")} />
          <span>Solo las que cargué yo</span>
        </label>
      </div>

      <div className="filtros-resumen" aria-live="polite">
        <p className="etiqueta">
          {hayFiltros ? `Mostrando ${filtradas.length} de ${series.length}` : `${series.length} títulos guardados por los socios`}
        </p>
        {hayFiltros && (
          <button type="button" className="btn-texto" onClick={() => setF({ ...VACIO, orden: f.orden })}>
            <Close className="icono" /> Limpiar filtros
          </button>
        )}
      </div>

      {hayFiltros && filtradas.length === 0 ? (
        <p className="vacio">Ningún título coincide con esos filtros.</p>
      ) : (
        <SerieList series={filtradas} uid={uid} {...props} />
      )}
    </>
  );
}
