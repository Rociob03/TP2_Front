
import { useEffect, useState, useCallback, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import {
  listarSeries,
  crearSerie,
  eliminarSerie,
  sumarVista,
  completarConImdb,
} from "./services/series";
import { buscarFichaPorTitulo, obtenerDetalle } from "./services/omdb";
import { datosParaGuardar } from "./services/tmdb";

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
import AuthPanel from "./components/AuthPanel";
import TicketAnimado from "./components/TicketAnimado";

import {
  Library,
  ListBox,
  Home as HomeIcon,
  Logout,
  Save,
} from "pixelarticons/react";

// Datos del usuario que usa la interfaz
const aPerfil = (u) => ({
  uid: u.uid,
  invitado: u.isAnonymous,
  nombre:
    u.displayName ||
    u.providerData?.find((p) => p.displayName)?.displayName ||
    u.email?.split("@")[0] ||
    "",
});

export default function App() {
  const [perfil, setPerfil] = useState(null);
  const [authListo, setAuthListo] = useState(false);
  const [mostrarVincular, setMostrarVincular] = useState(false);
  const [ticket, setTicket] = useState(null);
  const temporizadorTicket = useRef(null);

  const uid = perfil?.uid;

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

  // 1. Sesión: Firebase avisa cada vez que alguien entra o sale
  useEffect(() => {
    const cancelarSuscripcion = onAuthStateChanged(auth, (u) => {
      setPerfil(u ? aPerfil(u) : null);
      setAuthListo(true);
      if (!u) {
        setSeries([]);
        setMiLista([]);
        setVista("inicio");
        setCargando(true);
      }
    });

    return cancelarSuscripcion;
  }, []);

  // Después de entrar, crear cuenta o vincular, se actualiza el nombre y el tipo de usuario
  const onSesionLista = () => {
    if (!auth.currentUser) return;
    const eraInvitado = perfil?.invitado;
    setPerfil(aPerfil(auth.currentUser));
    if (mostrarVincular && eraInvitado) {
      setMostrarVincular(false);
      ok("¡Listo! Creaste tu cuenta y tu lista quedó guardada.");
    }
  };

  const cerrarSesion = async () => {
    if (
      perfil?.invitado &&
      !window.confirm("Entraste como invitado: si cerrás sesión vas a perder tu lista. ¿Salir igual?")
    ) {
      return;
    }
    try {
      await signOut(auth);
      setMostrarVincular(false);
      setMensaje(null);
    } catch (e) {
      fallo("No se pudo cerrar la sesión", e);
    }
  };

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

  // 2b. Series cargadas a mano: se buscan en IMDb (una sola vez) para sumar póster y puntaje
  const completando = useRef(false);
  useEffect(() => {
    const pendientes = series.filter((s) => !s.poster && !s.imdbID && !s.sinImdb).slice(0, 10);
    if (completando.current || pendientes.length === 0) return;
    completando.current = true;

    (async () => {
      for (const serie of pendientes) {
        try {
          const ficha = await buscarFichaPorTitulo(serie.titulo);
          await completarConImdb(serie.id, ficha);
          setSeries((prev) =>
            prev.map((s) =>
              s.id !== serie.id
                ? s
                : ficha
                ? { ...s, imdbID: ficha.imdbID, poster: ficha.poster, anio: ficha.anio, rating: ficha.rating, trama: ficha.trama, tipo: ficha.tipo }
                : { ...s, sinImdb: true }
            )
          );
        } catch (e) {
          // Si falla (sin conexión, límite de OMDb, reglas sin publicar) se reintenta en la próxima visita
          console.warn(`No se pudo completar "${serie.titulo}" con IMDb`, e);
          break;
        }
      }
      completando.current = false;
    })();
  }, [series]);

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
      ok(`"${datos.titulo}" se agregó a la biblioteca.`);
      return true;
    } catch (e) {
      fallo("No se pudo agregar a la biblioteca", e);
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
      ok(`"${serie.titulo}" se eliminó de la biblioteca.`);
    } catch (e) {
      fallo("No se pudo eliminar", e);
    }
  };

  // 5. Agregar una serie a Mi lista
  const onAgregarALista = async (serie) => {
    try {
      await agregarPorVer(uid, serie);
      setMiLista(await listarMiLista(uid));
      // En lugar del aviso común, se "imprime" un ticket del videoclub
      setMensaje(null);
      setTicket({
        clave: Date.now(),
        titulo: serie.titulo,
        fecha: new Date().toLocaleDateString("es-AR"),
        socio: perfil?.invitado ? "Invitado/a" : perfil?.nombre || "Socio/a",
      });
      clearTimeout(temporizadorTicket.current);
      temporizadorTicket.current = setTimeout(() => setTicket(null), 3200);
    } catch (e) {
      fallo("No se pudo agregar a tu lista", e);
    }
  };

  // 5b. Guardar para ver un título de TMDB (Estrenos, Tendencias, Mejor puntuadas):
  //     si no está en la biblioteca, primero se agrega con sus datos y su plataforma en Argentina
  const onGuardarTmdb = async (item) => {
    const mismoTitulo = (s) =>
      s.titulo.trim().toLowerCase() === item.titulo.trim().toLowerCase() &&
      (!s.anio || !item.anio || String(s.anio).startsWith(item.anio));
    let serie = series.find((s) => s.tmdbId === item.tmdbId || mismoTitulo(s));

    try {
      if (!serie) {
        const { plataforma, imdbID } = await datosParaGuardar(item);
        if (imdbID) serie = series.find((s) => s.imdbID === imdbID);

        if (!serie) {
          // El puntaje de IMDb se trae de OMDb (si falla, se guarda igual)
          const rating = imdbID
            ? await obtenerDetalle(imdbID).then((f) => f.rating).catch(() => "")
            : "";
          const ref = await crearSerie(
            {
              titulo: item.titulo.slice(0, 80),
              genero: item.genero || "Sin género",
              plataforma,
              tmdbId: item.tmdbId,
              imdb: { imdbID, poster: item.poster, anio: item.anio, rating, trama: item.trama, tipo: item.tipo },
            },
            uid
          );
          serie = { id: ref.id, titulo: item.titulo, poster: item.poster };
          setSeries(await listarSeries());
        }
      }
    } catch (e) {
      fallo("No se pudo agregar a la biblioteca", e);
      return;
    }

    if (idsEnLista.has(serie.id)) {
      setMensaje({ tipo: "ok", texto: `"${serie.titulo}" ya está en tu lista.` });
      return;
    }
    await onAgregarALista(serie);
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
            ? { ...i, estado: "vista", fecha: new Date() }
            : i
        )
      );

      ok(`"${item.titulo}" pasó a Vistas.`);
    } catch (e) {
      fallo("No se pudo actualizar tu lista", e);
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

  const irA = (id) => {
    setMostrarVincular(false);
    setVista(id);
  };

  const tab = (id) =>
    vista === id ? "btn tab activa" : "btn tab";

  // Mostrar la pantalla correspondiente
  const contenido =
    !authListo ? (
      <Cargando />
    ) : !perfil ? (
      <AuthPanel onListo={onSesionLista} />
    ) : mostrarVincular ? (
      <AuthPanel
        modo="vincular"
        onListo={onSesionLista}
        onCancelar={() => setMostrarVincular(false)}
      />
    ) : cargando ? (
      <Cargando />
    ) : vista === "inicio" ? (
      <Home
        series={series}
        miLista={miLista}
        idsEnLista={idsEnLista}
        onAgregar={onAgregarALista}
        onIrABiblioteca={() => setVista("biblioteca")}
        onGuardarTmdb={onGuardarTmdb}
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
        items={miLista.map((i) => ({
          ...i,
          poster: i.poster || series.find((s) => s.id === i.id)?.poster || null,
        }))}
        onVista={onMarcarVista}
        onQuitar={onQuitar}
      />
    );

  return (
    <div className="app">
      <header>
        <h1 className="logo">REEL CLUB</h1>

        {perfil && (
          <nav>
            <button
              className={tab("inicio")}
              aria-current={vista === "inicio" ? "page" : undefined}
              onClick={() => irA("inicio")}
            >
              <HomeIcon className="icono" />
              Inicio
            </button>

            <button
              className={tab("biblioteca")}
              aria-current={vista === "biblioteca" ? "page" : undefined}
              onClick={() => irA("biblioteca")}
            >
              <Library className="icono" />
              Biblioteca
            </button>

            <button
              className={tab("miLista")}
              aria-current={vista === "miLista" ? "page" : undefined}
              onClick={() => irA("miLista")}
            >
              <ListBox className="icono" />
              Mi lista
            </button>
          </nav>
        )}
      </header>

      {perfil && (
        <div className="sesion">
          <p className="saludo">
            {perfil.invitado ? "Hola, invitado" : `Hola, ${perfil.nombre}`}
          </p>
          {perfil.invitado && !mostrarVincular && (
            <button className="btn" onClick={() => setMostrarVincular(true)}>
              <Save className="icono" />
              Guardar mi lista
            </button>
          )}
          <button className="btn" onClick={cerrarSesion}>
            <Logout className="icono" />
            Cerrar sesión
          </button>
        </div>
      )}

      <Mensaje
        mensaje={mensaje}
        onCerrar={() => setMensaje(null)}
      />

      {contenido}

      <TicketAnimado ticket={ticket} />
    </div>
  );
}
