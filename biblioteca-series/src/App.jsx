
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
import { datosParaGuardar, fichaDesdeSerie } from "./services/tmdb";

import {
  listarMiLista,
  agregarPorVer,
  marcarVista,
  quitarDeLista,
  calificar,
  marcarFavorito,
  sumarAMiLista,
} from "./services/miLista";
import { textoEstrellas } from "./components/Estrellas";

import AgregarTitulo from "./components/AgregarTitulo";
import BibliotecaFiltrada from "./components/BibliotecaFiltrada";
import MiLista from "./components/MiLista";
import Mensaje from "./components/Mensaje";
import Cargando from "./components/Cargando";
import Home from "./components/Home";
import AuthPanel from "./components/AuthPanel";
import TicketAnimado from "./components/TicketAnimado";
import FichaTmdb from "./components/FichaTmdb";
import Pie from "./components/Pie";
import AvisoInvitado from "./components/AvisoInvitado";

import {
  Search,
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
  const [pestanaVincular, setPestanaVincular] = useState("crear"); // "crear" o "entrar" (ya tengo cuenta)
  const [ticket, setTicket] = useState(null);
  const [ficha, setFicha] = useState(null); // ficha abierta (tráiler, streaming, cines)
  // Aviso a invitados antes de guardar: la acción queda "en espera" hasta que eligen qué hacer
  const [avisoInvitado, setAvisoInvitado] = useState(null); // título que querían guardar
  const [seguirComoInvitado, setSeguirComoInvitado] = useState(false);
  // Guardado en espera: { nombre de la función, argumentos, resolve } (se ejecuta con los datos del usuario actual)
  const guardadoPendiente = useRef(null);
  const trasCargar = useRef(null); // guardado que espera a que se cargue la lista de la cuenta nueva
  const listaInvitado = useRef([]); // lo que tenía guardado el invitado al abrir "Guardar mi lista"
  const [abriendoFicha, setAbriendoFicha] = useState(false);
  const temporizadorTicket = useRef(null);

  const uid = perfil?.uid;

  const [series, setSeries] = useState([]);
  const [miLista, setMiLista] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [cargando, setCargando] = useState(true);
  const [uidCargado, setUidCargado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Los mensajes se cierran solos (los errores duran un poco más)
  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(null), mensaje.tipo === "error" ? 7000 : 4000);
    return () => clearTimeout(t);
  }, [mensaje]);

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

  // Siempre arriba al cambiar de pantalla
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [vista, mostrarVincular]);

  // Funciones de guardado de este render: un guardado en espera usa siempre las del usuario actual
  const guardados = useRef({});

  const ejecutarPendiente = async (p) => {
    if (!p) return;
    const resultado = await guardados.current[p.nombre](...p.args);
    p.resolve(resultado !== false);
  };
  const descartarPendiente = () => {
    guardadoPendiente.current?.resolve(false);
    guardadoPendiente.current = null;
  };

  // Abre "Guardar mi lista" (crear cuenta) o "Ya tengo cuenta" (entrar), sin perder lo guardado
  const abrirVincular = (pestana) => {
    listaInvitado.current = miLista;
    setPestanaVincular(pestana);
    setMostrarVincular(true);
  };

  // Después de entrar, crear cuenta o vincular, se actualiza el nombre y el tipo de usuario
  const onSesionLista = async (usuario, opciones) => {
    if (!auth.currentUser) return;
    const eraInvitado = perfil?.invitado;
    if (mostrarVincular && eraInvitado && opciones?.cambioDeCuenta) {
      // Entró a la cuenta que ya tenía: se le suma lo que guardó como invitado
      try {
        await sumarAMiLista(auth.currentUser.uid, listaInvitado.current);
      } catch (e) {
        fallo("No se pudo sumar tu lista de invitado", e);
      }
      listaInvitado.current = [];
      await cargar(auth.currentUser.uid); // recarga la lista de esa cuenta, ya con lo sumado
      trasCargar.current = guardadoPendiente.current; // y recién ahí se guarda lo que estaba en espera
      guardadoPendiente.current = null;
      setSeguirComoInvitado(false);
      setMostrarVincular(false);
      setPerfil(aPerfil(auth.currentUser));
      ok("¡Hola de nuevo! Sumamos a tu cuenta lo que guardaste como invitado.");
      return;
    }
    setPerfil(aPerfil(auth.currentUser));
    if (mostrarVincular && eraInvitado) {
      setMostrarVincular(false);
      ok("¡Listo! Creaste tu cuenta y tu lista quedó guardada.");
      // Si venía de tocar "Guardar para ver", se termina de guardar ahora (mismo uid)
      const pendiente = guardadoPendiente.current;
      guardadoPendiente.current = null;
      ejecutarPendiente(pendiente);
    }
  };

  // Envuelve cualquier "Guardar para ver": si es invitado, primero lo invita a crear su cuenta.
  // Devuelve una promesa que se resuelve cuando el guardado termina (o se cancela).
  const conCuenta = (nombre) => async (...args) => {
    if (perfil?.invitado && !seguirComoInvitado) {
      descartarPendiente();
      return new Promise((resolve) => {
        guardadoPendiente.current = { nombre, args, resolve };
        setAvisoInvitado(args[0]?.titulo || "");
      });
    }
    return guardados.current[nombre](...args);
  };

  const avisoCrearCuenta = () => {
    setAvisoInvitado(null);
    setFicha(null);
    abrirVincular("crear");
  };
  const avisoIniciarSesion = () => {
    setAvisoInvitado(null);
    setFicha(null);
    abrirVincular("entrar"); // ya no cierra la sesión: entra a su cuenta y conserva lo guardado
  };
  const avisoSeguir = () => {
    setSeguirComoInvitado(true);
    setAvisoInvitado(null);
    const pendiente = guardadoPendiente.current;
    guardadoPendiente.current = null;
    ejecutarPendiente(pendiente);
  };
  const avisoCerrar = () => {
    descartarPendiente();
    setAvisoInvitado(null);
  };

  const cerrarSesion = async () => {
    if (
      perfil?.invitado &&
      miLista.length > 0 &&
      !window.confirm("Entraste como invitado: si cerrás sesión vas a perder tu lista. ¿Salir igual?")
    ) {
      return;
    }
    try {
      await signOut(auth);
      setMostrarVincular(false);
      setSeguirComoInvitado(false);
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
      setUidCargado(id);
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

  // Si un invitado entró a su cuenta con un "Guardar para ver" en espera, se guarda cuando cargó esa cuenta
  useEffect(() => {
    if (!cargando && uid && uidCargado === uid && trasCargar.current) {
      const pendiente = trasCargar.current;
      trasCargar.current = null;
      ejecutarPendiente(pendiente);
    }
  });

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
  // "Guardar para ver" desde el formulario: una sola acción para el usuario.
  // Por detrás se guarda en el catálogo del club (si no estaba) y en su Por ver.
  const onAgregarSerie = async (datos) => {
    const repetida = series.find((s) =>
      (datos.tmdbId && s.tmdbId === datos.tmdbId) ||
      (datos.imdb?.imdbID && s.imdbID === datos.imdb.imdbID) ||
      s.titulo.trim().toLowerCase() === datos.titulo.toLowerCase()
    );
    if (repetida && idsEnLista.has(repetida.id)) {
      setMensaje({ tipo: "ok", texto: `"${repetida.titulo}" ya está en tu lista.` });
      return true;
    }
    if (repetida) return onAgregarALista(repetida);

    try {
      const ref = await crearSerie(datos, uid);
      setSeries(await listarSeries());
      return onAgregarALista({ id: ref.id, titulo: datos.titulo, poster: datos.imdb?.poster || null });
    } catch (e) {
      fallo("No se pudo guardar", e);
      return false;
    }
  };

  // 4. Eliminar una serie de la biblioteca
  const onEliminarSerie = async (serie) => {
    if (!window.confirm(`¿Sacar "${serie.titulo}" del catálogo del club? Se va a borrar para todos los socios.`)) {
      return;
    }

    try {
      await eliminarSerie(serie.id);
      setSeries((prev) =>
        prev.filter((s) => s.id !== serie.id)
      );
      ok(`"${serie.titulo}" se sacó del catálogo del club.`);
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
      return true;
    } catch (e) {
      fallo("No se pudo agregar a tu lista", e);
      return false;
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
      fallo("No se pudo guardar", e);
      return;
    }

    if (idsEnLista.has(serie.id)) {
      setMensaje({ tipo: "ok", texto: `"${serie.titulo}" ya está en tu lista.` });
      return;
    }
    await onAgregarALista(serie);
  };

  // 5c. Ficha de un título de la biblioteca: se busca en TMDB para mostrar tráiler y dónde verlo
  const onAbrirFichaSerie = async (serie) => {
    if (abriendoFicha) return;
    setAbriendoFicha(true);
    try {
      const datos = await fichaDesdeSerie(serie);
      if (datos) setFicha(datos);
      else setMensaje({ tipo: "error", texto: `No encontramos "${serie.titulo}" en TMDB.` });
    } catch (e) {
      fallo("No se pudo abrir la ficha", e);
    } finally {
      setAbriendoFicha(false);
    }
  };

  // Un título de TMDB está "en mi lista" si su serie de la biblioteca está en la lista
  const enMiListaTmdb = (item) =>
    item.serie
      ? idsEnLista.has(item.serie.id)
      : series.some(
          (s) =>
            idsEnLista.has(s.id) &&
            (s.tmdbId === item.tmdbId || s.titulo.trim().toLowerCase() === item.titulo.trim().toLowerCase())
        );

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

  // 6b. Calificar (½ a 5 estrellas). Se ve al instante y, si Firebase falla, se deshace.
  const onCalificar = async (item, valor) => {
    const anterior = item.calificacion ?? null;
    setMiLista((prev) => prev.map((i) => (i.id === item.id ? { ...i, calificacion: valor } : i)));
    try {
      await calificar(uid, item.id, valor);
      ok(valor
        ? `Calificaste "${item.titulo}" con ${textoEstrellas(valor)} ★`
        : `Borraste la calificación de "${item.titulo}".`);
    } catch (e) {
      setMiLista((prev) => prev.map((i) => (i.id === item.id ? { ...i, calificacion: anterior } : i)));
      fallo("No se pudo guardar la calificación", e);
    }
  };

  // 6c. Agregar o quitar de favoritas
  const onFavorito = async (item) => {
    const nuevo = !item.favorito;
    setMiLista((prev) => prev.map((i) => (i.id === item.id ? { ...i, favorito: nuevo } : i)));
    try {
      await marcarFavorito(uid, item.id, nuevo);
      ok(nuevo ? `"${item.titulo}" está en tus favoritas ♥` : `"${item.titulo}" ya no está en tus favoritas.`);
    } catch (e) {
      setMiLista((prev) => prev.map((i) => (i.id === item.id ? { ...i, favorito: !nuevo } : i)));
      fallo("No se pudo actualizar tus favoritas", e);
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

  // 7b. Quitar de la lista desde cualquier tarjeta o ficha (botón "En tu lista").
  //     Sirve para títulos del catálogo, de TMDB o de la propia lista.
  const onQuitarDeLista = async (x) => {
    const id =
      (x.id && idsEnLista.has(x.id) && x.id) ||
      (x.serie && x.serie.id) ||
      series.find(
        (s) =>
          idsEnLista.has(s.id) &&
          ((x.tmdbId && s.tmdbId === x.tmdbId) || s.titulo.trim().toLowerCase() === x.titulo.trim().toLowerCase())
      )?.id;
    const item = miLista.find((i) => i.id === id);
    if (!item) return;
    if ((item.calificacion || item.favorito) &&
        !window.confirm(`Si quitás "${item.titulo}" de tu lista, se borra tu calificación y tu favorita. ¿Quitarla igual?`)) {
      return;
    }
    await onQuitar(item);
  };

  // Identificar las series que ya están en Mi lista
  const idsEnLista = new Set(miLista.map((i) => i.id));

  const cerrarFicha = useCallback(() => setFicha(null), []);

  guardados.current = { onAgregarALista, onGuardarTmdb, onAgregarSerie };

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
        pestanaInicial={pestanaVincular}
        key={pestanaVincular}
        onCancelar={() => { descartarPendiente(); setMostrarVincular(false); }}
      />
    ) : cargando ? (
      <Cargando />
    ) : vista === "inicio" ? (
      <Home
        series={series}
        miLista={miLista}
        idsEnLista={idsEnLista}
        onAgregar={conCuenta("onAgregarALista")}
        onIrABiblioteca={() => setVista("biblioteca")}
        onGuardarTmdb={conCuenta("onGuardarTmdb")}
        enMiListaTmdb={enMiListaTmdb}
        onAbrirFicha={setFicha}
        onAbrirFichaSerie={onAbrirFichaSerie}
        onQuitarDeLista={onQuitarDeLista}
      />
    ) : vista === "biblioteca" ? (
      <>
        <AgregarTitulo
          onAgregar={conCuenta("onAgregarSerie")}
          enMiLista={enMiListaTmdb}
          onGuardarTmdb={conCuenta("onGuardarTmdb")}
          onAbrirFicha={setFicha}
          onQuitarDeLista={onQuitarDeLista}
        />
        <div className="catalogo-cabecera">
          <h2 className="titulo">Lo que guardan los socios</h2>
          <p className="ayuda">
            Todo lo que guardó la comunidad de Reel Club. Si algo te interesa, tocá "Guardar para ver".
          </p>
        </div>
        <BibliotecaFiltrada
          series={series}
          uid={uid}
          idsEnLista={idsEnLista}
          onAgregar={conCuenta("onAgregarALista")}
          onEliminar={onEliminarSerie}
          onAbrirFicha={onAbrirFichaSerie}
          onQuitarDeLista={onQuitarDeLista}
        />
      </>
    ) : (
      <MiLista
        items={miLista.map((i) => {
          const serie = series.find((s) => s.id === i.id);
          return { ...i, poster: i.poster || serie?.poster || null, tipo: serie?.tipo || null };
        })}
        onVista={onMarcarVista}
        onQuitar={onQuitar}
        onCalificar={onCalificar}
        onFavorito={onFavorito}
        onAbrirFicha={(i) => onAbrirFichaSerie(series.find((s) => s.id === i.id) || i)}
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
              <Search className="icono" />
              Buscar
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
            <button className="btn" onClick={() => abrirVincular("crear")}>
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

      <Pie />

      <TicketAnimado ticket={ticket} />


      {abriendoFicha && (
        <div className="modal-fondo" role="status" aria-live="polite">
          <div className="vhs"><p className="etiqueta">Buscando la ficha...</p><div className="vhs-barra"><span /></div></div>
        </div>
      )}

      {ficha && (
        <FichaTmdb
          item={ficha}
          enMiLista={enMiListaTmdb(ficha)}
          onGuardar={ficha.serie ? () => conCuenta("onAgregarALista")(ficha.serie) : conCuenta("onGuardarTmdb")}
          onQuitar={onQuitarDeLista}
          onCerrar={cerrarFicha}
        />
      )}

      {/* Después de la ficha, para que el aviso quede por encima si se guarda desde ahí */}
      {avisoInvitado !== null && (
        <AvisoInvitado
          titulo={avisoInvitado}
          onCrearCuenta={avisoCrearCuenta}
          onIniciarSesion={avisoIniciarSesion}
          onSeguir={avisoSeguir}
          onCerrar={avisoCerrar}
        />
      )}
    </div>
  );
}
