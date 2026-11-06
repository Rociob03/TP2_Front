import { Check, WarningDiamond, Close } from "pixelarticons/react";

export default function Mensaje({ mensaje, onCerrar }) {
  if (!mensaje) return null;
  const esOk = mensaje.tipo === "ok";
  return (
    <div className="tickets" role="alert">
      <div className={`ticket ${esOk ? "ok" : "error"}`} key={mensaje.texto}>
        {esOk ? <Check className="icono" /> : <WarningDiamond className="icono" />}
        <div>
          <p className="etiqueta">{esOk ? "Listo" : "Error"}</p>
          <p>{mensaje.texto}</p>
        </div>
        <button className="btn-icono" onClick={onCerrar} aria-label="Cerrar mensaje">
          <Close className="icono" />
        </button>
      </div>
    </div>
  );
}
