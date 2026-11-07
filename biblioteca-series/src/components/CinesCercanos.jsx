import { useEffect, useMemo, useState } from "react";
import { MapPin } from "pixelarticons/react";

// Datos abiertos: "Mapa Cultural – Salas de cine", Ministerio de Cultura de la Nación (SInCA / INCAA).
// El archivo se carga recién cuando se usa, para no hacer más pesada la app.
const cargarCines = () => import("../data/cines.json").then((m) => m.default);

// Distancia en km entre dos puntos (fórmula de Haversine)
function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
const formatoKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`);
const comoLlegar = (c) => `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`;

const ERRORES_UBICACION = {
  1: "No diste permiso para usar tu ubicación. Podés elegir tu provincia.",
  2: "No pudimos saber dónde estás. Probá elegir tu provincia.",
  3: "Tardó demasiado en encontrar tu ubicación. Probá de nuevo o elegí tu provincia.",
};

export default function CinesCercanos() {
  const [cines, setCines] = useState(null);
  const [errorDatos, setErrorDatos] = useState("");
  const [ubicacion, setUbicacion] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState("");
  const [provincia, setProvincia] = useState("");
  const [cantidad, setCantidad] = useState(5);

  useEffect(() => {
    cargarCines().then(setCines).catch(() => setErrorDatos("No se pudo cargar el listado de cines."));
  }, []);

  const provincias = useMemo(
    () => (cines ? [...new Set(cines.map((c) => c.provincia))].sort((a, b) => a.localeCompare(b, "es")) : []),
    [cines]
  );

  // Con ubicación: los más cercanos. Con provincia: los de esa provincia, por localidad.
  const lista = useMemo(() => {
    if (!cines) return [];
    if (ubicacion) {
      return cines
        .map((c) => ({ ...c, km: distanciaKm(ubicacion, c) }))
        .sort((a, b) => a.km - b.km);
    }
    if (provincia) {
      return cines
        .filter((c) => c.provincia === provincia)
        .sort((a, b) => a.localidad.localeCompare(b.localidad, "es") || a.nombre.localeCompare(b.nombre, "es"));
    }
    return [];
  }, [cines, ubicacion, provincia]);

  const usarUbicacion = () => {
    if (!("geolocation" in navigator)) {
      setErrorUbicacion("Tu navegador no permite usar la ubicación. Elegí tu provincia.");
      return;
    }
    setBuscando(true);
    setErrorUbicacion("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacion({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setProvincia("");
        setCantidad(5);
        setBuscando(false);
      },
      (err) => {
        setErrorUbicacion(ERRORES_UBICACION[err.code] || "No pudimos usar tu ubicación.");
        setBuscando(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  };

  const elegirProvincia = (e) => {
    setProvincia(e.target.value);
    setUbicacion(null);
    setCantidad(5);
  };

  if (errorDatos) return <p className="campo-error" role="alert">Error: {errorDatos}</p>;

  return (
    <div className="cercanos">
      <div className="cercanos-controles">
        <button type="button" className="btn primario" onClick={usarUbicacion} disabled={buscando || !cines}>
          <MapPin className="icono" />
          {buscando ? "Buscando tu ubicación..." : "Usar mi ubicación"}
        </button>
        <label className="cercanos-provincia">
          <span className="etiqueta">o elegí tu provincia</span>
          <select value={provincia} onChange={elegirProvincia} disabled={!cines}>
            <option value="">{cines ? "Provincia..." : "Cargando..."}</option>
            {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>

      <p className="ayuda" aria-live="polite">
        {errorUbicacion ||
          (ubicacion ? "Los cines más cercanos a vos:" : provincia ? `Cines en ${provincia}:` :
            "Tu ubicación se usa solo en este momento para calcular distancias: no se guarda.")}
      </p>

      {lista.length > 0 && (
        <>
          <ul className="cercanos-lista">
            {lista.slice(0, cantidad).map((c) => (
              <li key={`${c.nombre}-${c.lat}-${c.lon}`} className="cercano">
                <div className="cercano-datos">
                  <strong>{c.nombre}</strong>
                  <span className="etiqueta">
                    {c.direccion}{c.direccion && ", "}{c.localidad}
                  </span>
                  <span className="cercano-extras">
                    {c.km !== undefined && <span className="cercano-km">{formatoKm(c.km)}</span>}
                    {c.pantallas && <span className="etiqueta">{c.pantallas} {c.pantallas === 1 ? "sala" : "salas"}</span>}
                    {c.incaa && <span className="cercano-incaa">Espacio INCAA</span>}
                  </span>
                </div>
                <span className="cadena-links">
                  <a className="btn" href={comoLlegar(c)} target="_blank" rel="noreferrer">Cómo llegar</a>
                  {c.web && <a className="btn" href={c.web} target="_blank" rel="noreferrer">Web</a>}
                </span>
              </li>
            ))}
          </ul>
          {lista.length > cantidad && (
            <button type="button" className="btn-texto" onClick={() => setCantidad((n) => n + 10)}>
              Ver más cines ({lista.length - cantidad} más)
            </button>
          )}
        </>
      )}

      <p className="credito-tmdb">
        Fuente: Mapa Cultural – Salas de cine, Ministerio de Cultura de la Nación (datos abiertos, actualizados en 2022).
        Algunas salas pudieron cambiar o cerrar.
      </p>
    </div>
  );
}
