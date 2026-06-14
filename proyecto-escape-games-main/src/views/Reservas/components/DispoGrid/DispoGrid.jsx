import React, { useContext } from 'react';
import { AppContext } from '../../../../context/AppContext';
import { allRoomHours, escapeRooms, normalizeRoomHour, normalizeRoomName, roomSchedules } from '../../../../data/rooms';
import './DispoGrid.css';

const MESES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'
];

const DIAS_SEMANA = [
  'Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'
];

function normalizarHora(horaStr) {
  if (!horaStr) return null;
  const [h, m = '00'] = horaStr.split(':');
  const hora = Number(h);
  const minutos = Number(m);
  if (Number.isNaN(hora) || Number.isNaN(minutos)) return null;
  return `${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

function parsearFecha(str) {
  if (!str) return null;
  if (str.includes('-')) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d).setHours(0,0,0,0);
  }
  if (str.includes('/')) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d).setHours(0,0,0,0);
  }
  return null;
}

function isoALabel(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DIAS_SEMANA[date.getDay()]}, ${d} de ${MESES[m - 1]} de ${y}`;
}

export default function DispoGrid({ onReservaClick }) {
  const { reservations = [], fechaAuditoria } = useContext(AppContext);

  const salas = escapeRooms;
  const horas = allRoomHours;
  const tsAuditoria = parsearFecha(fechaAuditoria);

  const reservasDelDia = reservations.filter((r) => {
    const ts = parsearFecha(r.fecha);
    return ts !== null && tsAuditoria !== null && ts === tsAuditoria;
  });

  const idx = {};
  reservasDelDia.forEach((r) => {
    const sala = normalizeRoomName(r.sala);
    const h = normalizeRoomHour(sala, normalizarHora(r.hora));
    if (h) idx[`${sala}|${h}`] = { ...r, sala, hora: h };
  });

  const estadoClass = {
    Confirmada: 'celda--confirmada',
    Completada: 'celda--completada',
    Cancelada: 'celda--cancelada',
  };

  return (
    <div className="dg-wrapper">
      <p className="dg-dia-label">
        {fechaAuditoria
          ? <><strong>{isoALabel(fechaAuditoria)}</strong> - {reservasDelDia.length} reserva{reservasDelDia.length !== 1 ? 's' : ''}</>
          : 'Selecciona una fecha para ver la disponibilidad'}
      </p>

      <div className="dg-leyenda">
        {[
          { clase: 'leyenda--libre', label: 'Libre' },
          { clase: 'leyenda--confirmada', label: 'Confirmada' },
          { clase: 'leyenda--completada', label: 'Completada' },
          { clase: 'leyenda--cancelada', label: 'Cancelada' },
        ].map(({ clase, label }) => (
          <span key={label} className="dg-leyenda-item">
            <span className={`dg-leyenda-dot ${clase}`} />
            {label}
          </span>
        ))}
      </div>

      <div className="dg-scroll">
        <table className="dg-table">
          <thead>
            <tr>
              <th className="dg-th dg-th--sala">Sala</th>
              {horas.map((h) => <th key={h} className="dg-th">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {salas.length === 0 ? (
              <tr>
                <td colSpan={horas.length + 1} className="dg-empty">
                  No hay salas en el sistema.
                </td>
              </tr>
            ) : salas.map((sala) => (
              <tr key={sala}>
                <td className="dg-sala">{sala}</td>
                {horas.map((hora) => {
                  const esHorarioValido = roomSchedules[sala]?.includes(hora);
                  const res = idx[`${sala}|${hora}`];
                  return (
                    <td
                      key={hora}
                      className={`dg-celda ${!esHorarioValido ? 'celda--no-disponible' : res ? (estadoClass[res.estado] || '') : 'celda--libre'}`}
                      title={!esHorarioValido ? 'Sin horario para esta sala' : res ? `${res.cliente} - ${res.personas} pax - ${res.estado}` : 'Libre'}
                    >
                      {!esHorarioValido ? (
                        <span className="dg-celda-no-disponible"></span>
                      ) : res ? (
                        <button
                          type="button"
                          className="dg-celda-content dg-celda-button"
                          onClick={() => onReservaClick?.(res)}
                          title={`Ver detalle de ${res.cliente}`}
                        >
                          <span className="dg-celda-cliente">{res.cliente.split(' ')[0]}</span>
                          <span className="dg-celda-pax">{res.personas} pax</span>
                        </button>
                      ) : (
                        <span className="dg-celda-libre">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reservasDelDia.length === 0 && fechaAuditoria && (
        <p className="dg-sin-reservas">
          No hay reservas para este dia. Todas las salas estan libres.
        </p>
      )}
    </div>
  );
}
