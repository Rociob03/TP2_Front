
import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

import {
  listarSeries,
  crearSerie,
  eliminarSerie,
  sumarVista,
} from "./services/series";

import {
  listarMiLista,
  agregarPorVer,
  marcarVista,
  quitarDeLista,
} from "./services/miLista";

import SerieForm from "./components/SerieForm";
import SerieList from "./components/SerieList";
import MiLista from "./components/MiLista";
import Mensaje from "./components/Mensaje";
import Cargando from "./components/Cargando";
import Home from "./components/Home";

import {
  Library,
  ListBox,
  Home as HomeIcon,
} from "pixelarticons/react";

export default function App() {
  const [user, setUser] = useState(null);
  const [authListo, setAuthListo] = useState(false);

  const uid = user?.uid;

  const [series, setSeries] = useState([]);
  const [miLista, setMiLista] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  // Mostrar mensajes de éxito y error
  const ok = (texto) => {
    setMensaje({ tipo: "ok", texto });
  };

  const fallo = (texto, e) => {
    console.error(e);
    setMensaje({
      tipo: "error",
      texto: `${texto} (${e.code || e.message})`,
    });
  };

  // 1. Autenticación anónima con Firebase
  useEffect(() => {
    const cancelarSuscripcion = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthListo(true);
      } else {
        signInAnonymously(auth).catch((e) => {
          fallo("No se pudo iniciar la sesión anónima", e);
          setAuthListo(true);
          setCargando(false);
        });
      }
    });

    return cancelarSuscripcion;
  }, []);

  // 2. Cargar la biblioteca y la lista personal
  const cargar = useCallback(async (id) => {
    setCargando(true);

    try {
      const [s, l] = await Promise.all([
        listarSeries(),
        listarMiLista(id),
      ]);

      setSeries(s);
      setMiLista(l);
    } catch (e) {
      fallo("No se pudieron cargar los datos", e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (uid) {
      cargar(uid);
    }
  }, [uid, cargar]);

  // 3. Agregar una serie a la biblioteca
  const onAgregarSerie = async (datos) => {
    const repetida = series.find((s) =>
      (datos.imdb && s.imdbID === datos.imdb.imdbID) ||
      s.titulo.trim().toLowerCase() === datos.titulo.toLowerCase()
    );
    if (repetida) {
      setMensaje({
        tipo: "error",
        texto: `"${repetida.titulo}" ya está en la biblioteca.`,
      });
      return false;
    }

    try {
      await crearSerie(datos, uid);
      setSeries(await listarSeries());
      ok("Serie agregada a la biblioteca.");
      return true;
    } catch (e) {
      fallo("No se pudo agregar la serie", e);
      return false;
    }
  };

  // 4. Eliminar una serie de la biblioteca
  const onEliminarSerie = async (serie) => {
    if (!window.confirm(`¿Eliminar "${serie.titulo}" de la biblioteca?`)) {
      return;
    }

    try {
      await eliminarSerie(serie.id);
      setSeries((prev) =>
        prev.filter((s) => s.id !== serie.id)
      );
      ok("Serie eliminada.");
    } catch (e) {
      fallo("No se pudo eliminar la serie", e);
    }
  };

  // 5. Agregar una serie a Mi lista
  const onAgregarALista = async (serie) => {
    try {
      await agregarPorVer(uid, serie);
      setMiLista(await listarMiLista(uid));
      ok(`"${serie.titulo}" se agregó a Por ver.`);
    } catch (e) {
      fallo("No se pudo agregar a tu lista", e);
    }
  };

  // 6. Marcar una serie como vista
  const onMarcarVista = async (item) => {
    try {
      await marcarVista(uid, item.id);

      sumarVista(item.id)
        .then(() =>
          setSeries((prev) =>
            prev.map((x) =>
              x.id === item.id
                ? { ...x, vistas: (x.vistas || 0) + 1 }
                : x
            )
          )
        )
        .catch((e) => {
          console.error("No se pudo actualizar el contador de vistas", e);
        });

      setMiLista((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, estado: "vista" }
            : i
        )
      );

      ok(`"${item.titulo}" pasó a Vistas.`);
    } catch (e) {
      fallo("No se pudo actualizar la serie", e);
    }
  };

  // 7. Quitar una serie de Mi lista
  const onQuitar = async (item) => {
    try {
      await quitarDeLista(uid, item.id);

      setMiLista((prev) =>
        prev.filter((i) => i.id !== item.id)
      );

      ok(`"${item.titulo}" se quitó de tu lista.`);
    } catch (e) {
      fallo("No se pudo quitar de tu lista", e);
    }
  };

  // Identificar las series que ya están en Mi lista
  const idsEnLista = new Set(miLista.map((i) => i.id));

  const tab = (id) =>
    vista === id ? "btn tab activa" : "btn tab";

  // Mostrar la pantalla correspondiente
  const contenido =
    !authListo || !user || cargando ? (
      <Cargando />
    ) : vista === "inicio" ? (
      <Home
        series={series}
        miLista={miLista}
        idsEnLista={idsEnLista}
        onAgregar={onAgregarALista}
        onIrABiblioteca={() => setVista("biblioteca")}
      />
    ) : vista === "biblioteca" ? (
      <>
        <SerieForm onAgregar={onAgregarSerie} />
        <h2 className="titulo">Biblioteca</h2>
        <SerieList
          series={series}
          uid={uid}
          idsEnLista={idsEnLista}
          onAgregar={onAgregarALista}
          onEliminar={onEliminarSerie}
        />
      </>
    ) : (
      <MiLista
        items={miLista}
        onVista={onMarcarVista}
        onQuitar={onQuitar}
      />
    );

  return (
    <div className="app">
      <header>
        <h1 className="logo">REEL CLUB</h1>

        {user && (
          <nav>
            <button
              className={tab("inicio")}
              aria-current={vista === "inicio" ? "page" : undefined}
              onClick={() => setVista("inicio")}
            >
              <HomeIcon className="icono" />
              Inicio
            </button>

            <button
              className={tab("biblioteca")}
              aria-current={vista === "biblioteca" ? "page" : undefined}
              onClick={() => setVista("biblioteca")}
            >
              <Library className="icono" />
              Biblioteca
            </button>

            <button
              className={tab("miLista")}
              aria-current={vista === "miLista" ? "page" : undefined}
              onClick={() => setVista("miLista")}
            >
              <ListBox className="icono" />
              Mi lista
            </button>
          </nav>
        )}
      </header>

      <Mensaje
        mensaje={mensaje}
        onCerrar={() => setMensaje(null)}
      />

      {contenido}
    </div>
  );
}
