import React, { useEffect, useState } from 'react';
import { allRoomHours } from '../../../../data/rooms';
import './Calendario.css';

export default function Calendario({ reservations = [], onFechaBaseChange }) {
  const [fechaBase, setFechaBase] = useState(new Date());

  useEffect(() => {
    onFechaBaseChange?.(fechaBase);
  }, [fechaBase, onFechaBaseChange]);

  const anio = fechaBase.getFullYear();
  const mes = fechaBase.getMonth();

  const nombreMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const totalDiasMes = new Date(anio, mes + 1, 0).getDate();
  let primerDiaSemana = new Date(anio, mes, 1).getDay();
  primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  const diasMesArray = Array.from({ length: totalDiasMes }, (_, i) => i + 1);
  const espaciosVacios = Array.from({ length: primerDiaSemana }, (_, i) => i);

  const mesAnterior = () => setFechaBase(new Date(anio, mes - 1, 1));
  const mesSiguiente = () => setFechaBase(new Date(anio, mes + 1, 1));
  const seleccionarDia = (dia) => setFechaBase(new Date(anio, mes, dia));

  const obtenerDiasSemanaActual = () => {
    const dias = [];
    const fechaAux = new Date(fechaBase);
    const diaSemanaActual = fechaAux.getDay();
    const diferenciaALunes = diaSemanaActual === 0 ? -6 : 1 - diaSemanaActual;

    fechaAux.setDate(fechaAux.getDate() + diferenciaALunes);
    const nombresDiasCortos = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const anioStr = fechaAux.getFullYear();
      const mesStr = String(fechaAux.getMonth() + 1).padStart(2, '0');
      const diaStr = String(fechaAux.getDate()).padStart(2, '0');

      dias.push({
        nombre: nombresDiasCortos[i],
        numero: fechaAux.getDate(),
        fechaStr: `${anioStr}-${mesStr}-${diaStr}`,
        esHoy: new Date().toDateString() === fechaAux.toDateString(),
        esSeleccionado: fechaBase.toDateString() === fechaAux.toDateString()
      });
      fechaAux.setDate(fechaAux.getDate() + 1);
    }
    return dias;
  };

  const diasSemana = obtenerDiasSemanaActual();
  const horas = allRoomHours;

  const obtenerReservasCelda = (fechaStr, hora) => {
    const encontradas = reservations.filter(res => {
      if (!res.fecha || !res.hora) return false;
      const horaInicioReserva = res.hora.split(' ')[0].trim().padStart(5, '0');
      return res.fecha.trim() === fechaStr.trim() && horaInicioReserva === hora.trim();
    });

    const idsVistos = new Set();
    return encontradas.filter(res => {
      if (idsVistos.has(res.id)) return false;
      idsVistos.add(res.id);
      return true;
    });
  };

  const obtenerClaseReserva = (res) => {
    if (res.estado === 'Cancelada') return 'card-gray';
    if (res.pago !== 'Pagado') return 'card-orange';
    if (res.fecha >= new Date().toISOString().slice(0, 10)) return 'card-blue';
    return 'card-green';
  };

  const semanaAnterior = () => {
    const nuevaFecha = new Date(fechaBase);
    nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    setFechaBase(nuevaFecha);
  };

  const semanaSiguiente = () => {
    const nuevaFecha = new Date(fechaBase);
    nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    setFechaBase(nuevaFecha);
  };

  const diaTieneReservas = (dia) => {
    const mesStr = String(mes + 1).padStart(2, '0');
    const diaStr = String(dia).padStart(2, '0');
    const targetFecha = `${anio}-${mesStr}-${diaStr}`;
    return reservations.some(res => res.fecha === targetFecha);
  };

  return (
    <div className="calendario-reservas-container">
      <div className="cal-main-header">
        <h2>Calendario de Reservas</h2>
      </div>

      <div className="cal-layout-grid">
        <aside className="cal-sidebar-left">
          <div className="mini-month-header">
            <button type="button" className="arrow-btn" onClick={mesAnterior}>&lt;</button>
            <span>{nombreMeses[mes]} {anio}</span>
            <button type="button" className="arrow-btn" onClick={mesSiguiente}>&gt;</button>
          </div>

          <div className="mini-days-grid-labels">
            <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
          </div>

          <div className="mini-days-grid">
            {espaciosVacios.map(i => (
              <span key={`empty-${i}`} className="empty-day"></span>
            ))}

            {diasMesArray.map(dia => {
              const tieneTurno = diaTieneReservas(dia);
              const perteneceASemanaActual = diasSemana.some(d => d.numero === dia && new Date(d.fechaStr).getMonth() === mes);
              const esDiaSeleccionado = fechaBase.getDate() === dia && fechaBase.getMonth() === mes && fechaBase.getFullYear() === anio;
              const hoyObjeto = new Date();
              const esHoySistema = hoyObjeto.getDate() === dia && hoyObjeto.getMonth() === mes && hoyObjeto.getFullYear() === anio;

              return (
                <button
                  type="button"
                  key={dia}
                  className={`mini-day-cell
                    ${tieneTurno ? 'con-reserva' : ''}
                    ${perteneceASemanaActual ? 'highlight-orange' : ''}
                    ${esDiaSeleccionado ? 'dia-seleccionado' : ''}
                    ${esHoySistema ? 'es-hoy-sistema' : ''}`}
                  onClick={() => seleccionarDia(dia)}
                  aria-label={`Ver semana del ${dia} de ${nombreMeses[mes]}`}
                >
                  {dia}
                </button>
              );
            })}
          </div>

          <div className="cal-legend">
            <h4>Estados</h4>
            <div className="legend-item"><span className="dot yellow"></span> Pendiente por cobrar</div>
            <div className="legend-item"><span className="dot green"></span> Confirmada / pagada</div>
            <div className="legend-item"><span className="dot blue"></span> Turno futuro</div>
            <div className="legend-item"><span className="dot gray"></span> Cancelada</div>
          </div>
        </aside>

        <section className="cal-agenda-main">
          <div className="agenda-week-subheader">
            <div className="week-info-title">
              <h3>Semana del {diasSemana[0]?.numero} al {diasSemana[6]?.numero} de {nombreMeses[new Date(diasSemana[0]?.fechaStr).getMonth()]}</h3>
              <p>Monitoreo dinamico del flujo operacional</p>
            </div>
            <div className="week-navigation-controls">
              <button type="button" className="arrow-btn" onClick={semanaAnterior}>&lt;</button>
              <span className="current-week-label" style={{ cursor: 'pointer' }} onClick={() => setFechaBase(new Date())}>Hoy</span>
              <button type="button" className="arrow-btn" onClick={semanaSiguiente}>&gt;</button>
            </div>
          </div>

          <div className="agenda-table-wrapper">
            <table className="agenda-table">
              <thead>
                <tr>
                  <th className="time-col-header"></th>
                  {diasSemana.map(d => (
                    <th key={d.fechaStr} className={d.esSeleccionado ? 'selected-col-header' : d.esHoy ? 'today-col-header' : ''}>
                      <div className="day-name">{d.nombre}</div>
                      <div className={`day-number-badge ${d.esSeleccionado ? 'active-selected' : d.esHoy ? 'active-today' : ''}`}>{d.numero}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horas.map(hora => (
                  <tr key={hora}>
                    <td className="time-cell">{hora}</td>
                    {diasSemana.map(d => {
                      const reservasEnCelda = obtenerReservasCelda(d.fechaStr, hora);
                      return (
                        <td key={d.fechaStr} className="agenda-slot-cell">
                          {reservasEnCelda.length > 0 && (
                            <div className="cards-simultaneas-container">
                              {reservasEnCelda.map((res, index) => {
                                const estadoClase = obtenerClaseReserva(res);

                                return (
                                  <div key={res.id || index} className={`reservation-agenda-card ${estadoClase}`}>
                                    <div className="res-time-box">{res.hora} hs</div>
                                    <div className="res-client-name">{res.cliente} ({res.personas}p)</div>
                                    <div className="res-room-name">{res.sala}</div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
