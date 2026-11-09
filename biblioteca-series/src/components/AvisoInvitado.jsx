import { useEffect } from "react";
import { Save, Login, Close } from "pixelarticons/react";

// Aviso para invitados: antes de guardar, se los invita a crear su cuenta
export default function AvisoInvitado({ titulo, onCrearCuenta, onIniciarSesion, onSeguir, onCerrar }) {
  useEffect(() => {
    const alTeclear = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div
        className="modal panel aviso-invitado"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aviso-invitado-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn-icono ficha-cerrar" onClick={onCerrar} aria-label="Cerrar">
          <Close className="icono" />
        </button>
        <p className="etiqueta">Carnet de socio pendiente</p>
        <h2 className="titulo" id="aviso-invitado-titulo">¡Que no se te pierda tu lista!</h2>
        <p>
          Entraste como <strong>invitado</strong>: lo que guardes queda solo en este navegador y se pierde
          si cerrás sesión o entrás desde otro dispositivo.
        </p>
        <p>
          Creá tu cuenta en un minuto y {titulo ? <>guardamos <strong>"{titulo}"</strong></> : "guardamos lo que elegiste"} en
          tu lista para siempre, en la compu y en el celular.
        </p>

        <div className="aviso-invitado-acciones">
          <button type="button" className="btn primario btn-grande" onClick={onCrearCuenta} autoFocus>
            <Save className="icono" /> Crear mi cuenta
          </button>
          <button type="button" className="btn" onClick={onIniciarSesion}>
            <Login className="icono" /> Ya tengo cuenta
          </button>
          <button type="button" className="btn-texto" onClick={onSeguir}>
            Seguir como invitado y guardarla igual
          </button>
        </div>
      </div>
    </div>
  );
}
