import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const MENSAJES = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/email-already-in-use": "Ese email ya tiene una cuenta.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email": "El email no es válido.",
  "auth/operation-not-allowed": "Falta habilitar Correo/contraseña en Firebase.",
};

export default function AuthPanel() {
  const [registro, setRegistro] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !pass) return setError("Completá email y contraseña.");
    setEnviando(true);
    try {
      const fn = registro ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      await fn(auth, email.trim(), pass);
    } catch (err) {
      setError(MENSAJES[err.code] || `No se pudo continuar (${err.code})`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="panel form auth" onSubmit={enviar} noValidate>
      <h2 className="titulo">{registro ? "Crear cuenta" : "Iniciar sesión"}</h2>
      <label>
        <span className="etiqueta">Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label>
        <span className="etiqueta">Contraseña</span>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)}
          autoComplete={registro ? "new-password" : "current-password"} />
      </label>
      {error && <p className="campo-error" role="alert">Error: {error}</p>}
      <button type="submit" className="btn primario" disabled={enviando}>
        {enviando ? "Un momento..." : registro ? "Crear cuenta" : "Entrar"}
      </button>
      <button type="button" className="btn" onClick={() => { setRegistro(!registro); setError(""); }}>
        {registro ? "Ya tengo cuenta" : "Crear una cuenta nueva"}
      </button>
    </form>
  );
}
