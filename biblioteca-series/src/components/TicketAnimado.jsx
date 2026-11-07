// Ticket que "se imprime" al guardar una serie para ver (metáfora del videoclub)
export default function TicketAnimado({ ticket }) {
  if (!ticket) return null;
  return (
    <div className="impresora" role="status" aria-live="polite">
      <div className="ticket-impreso" key={ticket.clave}>
        <p className="ti-marca">REEL CLUB</p>
        <p className="ti-sub">Videoclub · Tu lista</p>
        <p className="ti-linea" aria-hidden="true">--------------------------</p>
        <p className="ti-etiqueta">Agregada a Por ver</p>
        <p className="ti-titulo">{ticket.titulo}</p>
        <p className="ti-fila"><span>Fecha</span><span>{ticket.fecha}</span></p>
        <p className="ti-fila"><span>Socio/a</span><span>{ticket.socio}</span></p>
        <div className="codigo-barras" aria-hidden="true" />
        <p className="ti-gracias">¡Que la disfrutes!</p>
      </div>
    </div>
  );
}
