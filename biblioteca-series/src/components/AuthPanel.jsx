import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  sendPasswordResetEmail,
  updateProfile,
  linkWithCredential,
  linkWithPopup,
  signInWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import { Eye, EyeOff, Login, UserPlus, Star, ListBox, Monitor } from "pixelarticons/react";
import { auth } from "../firebase";

const MENSAJES = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/wrong-password": "Email o contraseña incorrectos.",
  "auth/user-not-found": "No hay ninguna cuenta con ese email.",
  "auth/email-already-in-use": "Ese email ya tiene una cuenta. Probá iniciar sesión.",
  "auth/credential-already-in-use": "Esa cuenta de Google ya está registrada. Cerrá sesión e ingresá con ella.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email": "El email no es válido.",
  "auth/missing-password": "Escribí tu contraseña.",
  "auth/too-many-requests": "Demasiados intentos. Esperá unos minutos y probá de nuevo.",
  "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
  "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permití las ventanas emergentes.",
  "auth/unauthorized-domain": "Este sitio no está autorizado en Firebase (Authentication → Dominios autorizados).",
  "auth/operation-not-allowed": "Este método de acceso no está habilitado en Firebase.",
  "auth/network-request-failed": "No hay conexión. Revisá internet y probá de nuevo.",
};

const traducir = (err) => MENSAJES[err.code] || `No se pudo continuar (${err.code || err.message})`;
const google = new GoogleAuthProvider();

const FRASES = [
  "Armá tu lista de pendientes.",
  "Descubrí qué ver esta noche.",
  "Tus pelis y series, en todos tus dispositivos.",
  "Rebobiná tus clásicos favoritos.",
];

// Frase que se escribe y se borra sola, como una máquina de escribir
function useMaquinaDeEscribir(frases) {
  const [texto, setTexto] = useState("");
  const [indice, setIndice] = useState(0);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    const completa = frases[indice];
    if (!borrando && texto === completa) {
      const pausa = setTimeout(() => setBorrando(true), 1800);
      return () => clearTimeout(pausa);
    }
    if (borrando && texto === "") {
      setBorrando(false);
      setIndice((i) => (i + 1) % frases.length);
      return;
    }
    const paso = setTimeout(() => {
      setTexto(borrando ? completa.slice(0, texto.length - 1) : completa.slice(0, texto.length + 1));
    }, borrando ? 30 : 60);
    return () => clearTimeout(paso);
  }, [texto, borrando, indice, frases]);

  return texto;
}

// Seguridad de la contraseña: 0 a 4
function medirClave(clave) {
  if (!clave) return 0;
  let puntos = 0;
  if (clave.length >= 6) puntos++;
  if (clave.length >= 10) puntos++;
  if (/[A-Z]/.test(clave) && /[a-z]/.test(clave)) puntos++;
  if (/\d/.test(clave) && /[^A-Za-z0-9]/.test(clave)) puntos++;
  else if (/\d/.test(clave) || /[^A-Za-z0-9]/.test(clave)) puntos += 0.5;
  return Math.min(4, Math.floor(puntos));
}
const NIVELES = ["", "Débil", "Aceptable", "Buena", "Excelente"];

// Número de socio "decorativo", siempre igual para el mismo email
function numeroDeSocio(email) {
  let h = 7;
  for (const c of email.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 1000000;
  return String(h).padStart(6, "0");
}

/**
 * modo "inicio":   pantalla de entrada (iniciar sesión, crear cuenta, Google o invitado).
 * modo "vincular": un invitado guarda su lista. Puede crear su cuenta (se vincula a la misma identidad
 *                  y conserva el mismo uid) o entrar con una cuenta que ya tenía (App le suma a esa
 *                  cuenta lo que guardó como invitado). pestanaInicial: "crear" o "entrar".
 */
export default function AuthPanel({ modo = "inicio", pestanaInicial = "crear", onListo, onCancelar }) {
  const vincular = modo === "vincular";
  const [registro, setRegistro] = useState(vincular && pestanaInicial === "crear");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState("");
  const [sacudir, setSacudir] = useState(0);
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const frase = useMaquinaDeEscribir(FRASES);

  const mostrarError = (texto) => {
    setError(texto);
    setSacudir((n) => n + 1); // vuelve a disparar la animación de "sacudón"
  };

  const cambiarModo = (esRegistro) => {
    setRegistro(esRegistro);
    setError("");
    setAviso("");
  };

  // Ejecuta una acción de Firebase mostrando carga y errores.
  // La acción devuelve [usuario, opciones]; opciones = { cambioDeCuenta: true } si un invitado entró a una cuenta que ya existía.
  const intentar = async (accion) => {
    setError("");
    setAviso("");
    setEnviando(true);
    try {
      const [usuario, opciones] = await accion();
      await onListo?.(usuario, opciones);
    } catch (err) {
      mostrarError(traducir(err));
    } finally {
      setEnviando(false);
    }
  };

  const enviar = (e) => {
    e.preventDefault();
    const correo = email.trim();
    if (registro && !nombre.trim()) return mostrarError("Contanos cómo te llamás.");
    if (!correo || !pass) return mostrarError("Completá email y contraseña.");
    if (registro && pass.length < 6) return mostrarError("La contraseña debe tener al menos 6 caracteres.");

    intentar(async () => {
      let cred;
      if (vincular && registro) {
        // El invitado pasa a tener cuenta sin perder sus datos (mismo uid)
        cred = await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(correo, pass));
      } else if (vincular) {
        // El invitado ya tenía cuenta: entra con ella y App le suma lo que guardó como invitado
        cred = await signInWithEmailAndPassword(auth, correo, pass);
        return [cred.user, { cambioDeCuenta: true }];
      } else if (registro) {
        cred = await createUserWithEmailAndPassword(auth, correo, pass);
      } else {
        cred = await signInWithEmailAndPassword(auth, correo, pass);
      }
      if (registro) await updateProfile(cred.user, { displayName: nombre.trim() });
      return [cred.user];
    });
  };

  const conGoogle = () =>
    intentar(async () => {
      if (!vincular) return [(await signInWithPopup(auth, google)).user];
      try {
        // Si esa cuenta de Google es nueva, se vincula al invitado (mismo uid)
        return [(await linkWithPopup(auth.currentUser, google)).user];
      } catch (err) {
        // Si ya estaba registrada, se entra con ella y se le suma lo guardado como invitado
        const credencial = err.code === "auth/credential-already-in-use" && GoogleAuthProvider.credentialFromError(err);
        if (!credencial) throw err;
        return [(await signInWithCredential(auth, credencial)).user, { cambioDeCuenta: true }];
      }
    });

  const comoInvitado = () => intentar(async () => [(await signInAnonymously(auth)).user]);

  const recuperar = async () => {
    const correo = email.trim();
    if (!correo) return mostrarError("Escribí tu email y volvé a tocar \"Olvidé mi contraseña\".");
    setError("");
    setEnviando(true);
    try {
      await sendPasswordResetEmail(auth, correo);
      setAviso(`Te mandamos un mail a ${correo} para crear una contraseña nueva.`);
    } catch (err) {
      mostrarError(traducir(err));
    } finally {
      setEnviando(false);
    }
  };

  const nivel = medirClave(pass);

  const formulario = (
    <form
      className={`carnet ${error ? "sacudir" : ""}`}
      key={sacudir}
      onSubmit={enviar}
      noValidate
    >
      {/* Carnet de socio: se completa mientras escribís */}
      <div className="carnet-cabecera">
        <div>
          <p className="etiqueta">Videoclub</p>
          <p className="carnet-marca">REEL CLUB</p>
        </div>
        <span className="carnet-holograma" aria-hidden="true" />
      </div>
      <div className="carnet-datos" aria-hidden="true">
        <p className="etiqueta">Socio/a</p>
        <p className="carnet-nombre">
          {registro ? nombre.trim() || "Tu nombre" : email.trim() ? email.trim().split("@")[0] : "¡Hola de nuevo!"}
        </p>
        <p className="etiqueta carnet-numero">
          Nº {email.trim() ? numeroDeSocio(email.trim()) : "------"}
        </p>
      </div>

      {vincular && (
        <div className="carnet-intro">
          <p className="ayuda">
            {registro
              ? "Creá tu cuenta y vas a conservar tu lista para verla desde cualquier dispositivo."
              : "Entrá con tu cuenta y le sumamos lo que guardaste como invitado."}
          </p>
        </div>
      )}
      <div className="pestanas" role="tablist" aria-label="Elegí una opción">
        <span className={`pestanas-indicador ${registro ? "derecha" : ""}`} aria-hidden="true" />
        <button type="button" role="tab" aria-selected={!registro} onClick={() => cambiarModo(false)}>
          <Login className="icono" /> {vincular ? "Ya tengo cuenta" : "Entrar"}
        </button>
        <button type="button" role="tab" aria-selected={registro} onClick={() => cambiarModo(true)}>
          <UserPlus className="icono" /> Crear cuenta
        </button>
      </div>

      <div className="carnet-campos">
        {registro && (
          <label className="aparecer">
            <span className="etiqueta">Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" maxLength={40} placeholder="¿Cómo te llamás?" />
          </label>
        )}
        <label>
          <span className="etiqueta">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tu@email.com" />
        </label>
        <label>
          <span className="etiqueta">Contraseña</span>
          <span className="campo-clave">
            <input
              type={verClave ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete={registro ? "new-password" : "current-password"}
              placeholder={registro ? "Mínimo 6 caracteres" : ""}
            />
            <button
              type="button"
              className="btn-icono"
              onClick={() => setVerClave(!verClave)}
              aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {verClave ? <EyeOff className="icono" /> : <Eye className="icono" />}
            </button>
          </span>
        </label>

        {registro && pass && (
          <div className={`medidor n${nivel}`} aria-live="polite">
            <div className="medidor-barras" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => <span key={i} className={i <= nivel ? "llena" : ""} />)}
            </div>
            <p className="etiqueta">Seguridad: {NIVELES[nivel] || "Muy débil"}</p>
          </div>
        )}

        {error && <p className="campo-error" role="alert">Error: {error}</p>}
        {aviso && <p className="aviso-ok" role="status">{aviso}</p>}

        <button type="submit" className="btn primario btn-grande" disabled={enviando}>
          {enviando ? <span className="girando" aria-hidden="true" /> : null}
          {enviando ? "Un momento..." : registro ? "Crear mi carnet" : "Entrar al club"}
        </button>

        {!registro && (
          <button type="button" className="btn-texto" onClick={recuperar} disabled={enviando}>
            Olvidé mi contraseña
          </button>
        )}

        <p className="separador"><span>o</span></p>

        <button type="button" className="btn" onClick={conGoogle} disabled={enviando}>
          <span className="logo-g" aria-hidden="true">G</span> Continuar con Google
        </button>

        {vincular ? (
          <button type="button" className="btn-texto" onClick={onCancelar}>Ahora no</button>
        ) : (
          <button type="button" className="btn-texto" onClick={comoInvitado} disabled={enviando}>
            Entrar como invitado
          </button>
        )}
      </div>
    </form>
  );

  // La misma pantalla sirve para entrar y para que un invitado guarde su lista
  // (antes, al vincular, el carnet quedaba solo y angosto)
  return (
    <section className="acceso">
      <div className="acceso-escena">
        <div className="sol" aria-hidden="true" />
        <div className="piso" aria-hidden="true" />
        <div className="acceso-texto">
          <p className="etiqueta">{vincular ? "Carnet de socio pendiente" : "Películas · Series · Clásicos"}</p>
          {vincular ? <h2>GUARDÁ<br />TU LISTA</h2> : <h2>BIENVENIDOS<br />AL CLUB</h2>}
          <p className="maquina" aria-live="off">
            {frase}<span className="cursor" aria-hidden="true">▌</span>
          </p>
          <ul className="beneficios">
            <li style={{ "--i": 0 }}><ListBox className="icono" /> Tu lista de Por ver y Vistas</li>
            <li style={{ "--i": 1 }}><Star className="icono" /> Pósters y puntajes de IMDb</li>
            <li style={{ "--i": 2 }}><Monitor className="icono" /> En la compu y en el celular</li>
          </ul>
        </div>
      </div>
      {formulario}
    </section>
  );
}
