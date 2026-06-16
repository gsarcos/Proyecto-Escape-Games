// src/views/Reservas/Reservas.jsx
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import DateSelector from './components/DateSelector/DateSelector';
import DispoGrid from './components/DispoGrid/DispoGrid';
import MetricCard from '../../components/MetricCard/MetricCard';
import './Reservas.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { escapeRooms, roomSchedules } from '../../data/rooms';
import { calcularResumenPagoReserva } from '../../utils/reservasFinanzas';

export default function Reservas() {
  const {
    reservations = [],
    setReservations,
    payments = [],
    fechaAuditoria,
    triggerToast,
    currentUser,
    setCurrentView,
    setPaymentDraft,
  } = useContext(AppContext);

  const [busqueda, setBusqueda]         = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [fechaDesdeListado, setFechaDesdeListado] = useState(fechaAuditoria);
  const [fechaHastaListado, setFechaHastaListado] = useState(fechaAuditoria);

  // Modales
  const [modalVer, setModalVer]           = useState(null);
  const [modalEditar, setModalEditar]     = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [formEditar, setFormEditar]       = useState({});

  useEffect(() => {
    setFechaDesdeListado(fechaAuditoria);
    setFechaHastaListado(fechaAuditoria);
  }, [fechaAuditoria]);

  // fechasCoinciden: compara dos fechas independientemente de su formato.
  // Soporta:
  //   - "D/M/AAAA" o "DD/MM/AAAA"  (formato legado con barras)
  const parsearFecha = (str) => {
    if (!str) return null;
    if (str.includes('-')) {
      // Formato ISO: "2026-06-20"
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d).setHours(0,0,0,0);
    }
    if (str.includes('/')) {
      // Formato legado: "20/6/2026" o "20/06/2026"
      const [d, m, y] = str.split('/').map(Number);
      return new Date(y, m - 1, d).setHours(0,0,0,0);
    }
    return null;
  };

  const fechasCoinciden = (fechaReserva, fechaAud) => {
    const ts1 = parsearFecha(fechaReserva);
    const ts2 = parsearFecha(fechaAud);
    return ts1 !== null && ts2 !== null && ts1 === ts2;
  };

  const formatFecha = (str) => {
    if (!str) return '';
    if (str.includes('-')) {
      const [y, m, d] = str.split('-');
      return `${d}/${m}/${y}`;
    }
    return str;
  };

  const estaEnPeriodoListado = (fechaReserva) => {
    const fechaReservaTs = parsearFecha(fechaReserva);
    const desdeTs = parsearFecha(fechaDesdeListado);
    const hastaTs = parsearFecha(fechaHastaListado);
    if (fechaReservaTs === null || desdeTs === null || hastaTs === null) return false;
    return fechaReservaTs >= Math.min(desdeTs, hastaTs) && fechaReservaTs <= Math.max(desdeTs, hastaTs);
  };

  const labelPeriodoListado = `del ${formatFecha(fechaDesdeListado)} al ${formatFecha(fechaHastaListado)}`;

  const generarTelefonoMock = (semilla = '') => {
    let hash = 0;
    String(semilla).split('').forEach((char) => {
      hash = ((hash * 31) + char.charCodeAt(0)) >>> 0;
    });
    const parteA = String(1000 + (hash % 9000)).padStart(4, '0');
    const parteB = String(1000 + (Math.floor(hash / 97) % 9000)).padStart(4, '0');
    return `+54 11 ${parteA}-${parteB}`;
  };

  const telefonoVisible = (reserva) => {
    if (reserva?.telefono && !/^(\+54\s11\s)?0{4}-0{4}$/.test(reserva.telefono)) return reserva.telefono;
    return generarTelefonoMock(`${reserva?.id || ''}-${reserva?.cliente || ''}`);
  };

  const reservasDelDia  = reservations.filter(r => fechasCoinciden(r.fecha, fechaAuditoria));
  const cantConfirmadas = reservasDelDia.filter(r => r.estado === 'Confirmada').length;
  const cantCanceladas  = reservasDelDia.filter(r => r.estado === 'Cancelada').length;
  const cantCompletadas = reservasDelDia.filter(r => r.estado === 'Completada').length;

  const reservasFiltradasParaTabla = reservations.filter(res => {
    const texto = busqueda.toLowerCase();
    const matchesTexto =
      res.cliente?.toLowerCase().includes(texto) ||
      res.sala?.toLowerCase().includes(texto) ||
      res.id?.toLowerCase().includes(texto) ||
      res.telefono?.toLowerCase().includes(texto);
    return matchesTexto
      && estaEnPeriodoListado(res.fecha)
      && (estadoFiltro === 'Todos' || res.estado === estadoFiltro);
  });

  const modalVerActual = modalVer ? reservations.find((reserva) => reserva.id === modalVer.id) || modalVer : null;
  const resumenModal = modalVerActual ? calcularResumenPagoReserva(modalVerActual, payments) : null;
  const puedeGenerarPagoRapido = currentUser?.rol === 'ANALISTA';

  const abrirEditar = (r) => { setFormEditar({ ...r }); setModalEditar(r); };

  const guardarEdicion = () => {
    const resumenEditado = calcularResumenPagoReserva(formEditar, payments);
    const reservaEditada = resumenEditado.estaSaldada
      ? { ...formEditar, estado: 'Completada', pago: 'Pagado' }
      : { ...formEditar };
    setReservations(prev => prev.map(r => r.id === formEditar.id ? reservaEditada : r));
    setModalEditar(null);
    triggerToast('Reserva actualizada correctamente');
  };

  const confirmarEliminar = () => {
    setReservations(prev => prev.filter(r => r.id !== modalEliminar.id));
    setModalEliminar(null);
    triggerToast('Reserva eliminada');
  };

  const generarPagoDesdeReserva = (reserva) => {
    setPaymentDraft({
      tipo: 'Ingreso',
      cliente: reserva.cliente || '',
      sala: reserva.sala || '',
      reservaId: reserva.id || '',
      fecha: fechaAuditoria,
    });
    setModalVer(null);
    setCurrentView('PAGOS');
  };

  const estadoBadgeClass = (estado) => `badge-status ${estado?.toLowerCase() || 'confirmada'}`;
  const pagoBadgeClass   = (pago)   => `badge-pago ${pago?.toLowerCase() === 'pagado' ? 'pagado' : 'pendiente'}`;

  return (
    <div className="reservas-view-container">

      <header className="reservas-header">
        <div className="header-left">
          <h1>Gestion de Reservas</h1>
          <p className="subtitle">Administra todas las reservas del sistema</p>
        </div>
      </header>

      <div className="reservas-metrics-grid">
        <MetricCard label="Confirmada" value={cantConfirmadas} variant="green" />
        <MetricCard label="Cancelada"  value={cantCanceladas}  variant="orange" />
        <MetricCard label="Completada" value={cantCompletadas} variant="blue" />
      </div>

      <section className="matriz-operativa-section">
        <div className="matriz-header-row">
          <h2>Matriz Operativa del Dia</h2>
          <DateSelector />
        </div>
        <DispoGrid fechasCoinciden={fechasCoinciden} onReservaClick={setModalVer} />
      </section>

      <div className="table-tools-bar">
        <div className="search-input-wrapper">
          <i className="fa-solid fa-magnifying-glass icon-search"></i>
          <input
            type="text"
            placeholder="Buscar por cliente, sala o ID de reserva..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-search"
          />
        </div>
        <div className="tools-right">
          <div className="date-range-filter" aria-label="Rango de fechas del listado">
            <label>
              Desde
              <input
                type="date"
                value={fechaDesdeListado}
                onChange={(e) => setFechaDesdeListado(e.target.value)}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={fechaHastaListado}
                onChange={(e) => setFechaHastaListado(e.target.value)}
              />
            </label>
          </div>
          <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="select-filter">
            <option value="Todos">Todos los estados</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Completada">Completada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
          <button className="btn-exportar">
            <i className="fa-solid fa-download"></i> Exportar
          </button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header-title">
          Listado de Reservas {labelPeriodoListado} <span className="table-count">({reservasFiltradasParaTabla.length})</span>
        </div>
        <div className="reservas-table-scroll">
          <table className="reservas-table">
            <colgroup>
              <col className="col-id" />
              <col className="col-cliente" />
              <col className="col-sala" />
              <col className="col-fecha" />
              <col className="col-personas" />
              <col className="col-estado" />
              <col className="col-pago" />
              <col className="col-canal" />
              <col className="col-acciones" />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Sala</th>
                <th>Fecha y Hora</th>
                <th>Personas</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Canal</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservasFiltradasParaTabla.length > 0 ? (
                reservasFiltradasParaTabla.map((res) => (
                  <tr key={res.id}>
                    <td className="txt-id">{res.id}</td>
                    <td>
                      <div className="customer-cell">
                        <strong className="customer-fullname">{res.cliente}</strong>
                        <span className="customer-phone">{telefonoVisible(res)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="sala-cell">
                        <strong className="sala-name">{res.sala}</strong>
                        <span className="sala-category">Clasificacion</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <strong className="date-day">{formatFecha(res.fecha)}</strong>
                        <span className="date-hours">{res.hora}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="pax-tag">
                        <i className="fa-solid fa-user-group icon-pax"></i> {res.personas}
                      </span>
                    </td>
                    <td>
                      <span className={estadoBadgeClass(res.estado)}>
                        <span className="status-indicator-dot"></span> {res.estado}
                      </span>
                    </td>
                    <td>
                      <span className={pagoBadgeClass(res.pago)}>
                        <i className="fa-solid fa-wallet icon-wallet"></i> {res.pago}
                      </span>
                    </td>
                    <td>
                      <span className="channel-tag">{res.canal}</span>
                    </td>
                    <td className="text-center">
                      <div className="actions-cell">
                        <button className="btn-action view" title="Ver detalle" onClick={() => setModalVer(res)}>
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button className="btn-action edit" title="Editar" onClick={() => abrirEditar(res)}>
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button className="btn-action delete" title="Eliminar" onClick={() => setModalEliminar(res)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-data-msg">No se encontraron registros que coincidan con la busqueda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalVerActual && (
        <div className="rv-modal-overlay" onClick={() => setModalVer(null)}>
          <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rv-modal-header">
              <h2>Detalle de Reserva</h2>
              <button className="rv-modal-close" onClick={() => setModalVer(null)}>X</button>
            </div>
            <div className="rv-modal-body">
              <div className="rv-info-grid">
                <div className="rv-info-block rv-info-block--full">
                  <span className="rv-info-label">Cliente</span>
                  <span className="rv-info-value rv-info-value--lg">{modalVerActual.cliente}</span>
                  <span className="rv-info-sub">{telefonoVisible(modalVerActual)}</span>
                </div>
                <div className="rv-info-block">
                  <span className="rv-info-label">ID Reserva</span>
                  <span className="rv-info-value rv-info-value--mono">{modalVerActual.id}</span>
                </div>
                <div className="rv-info-block">
                  <span className="rv-info-label">Sala</span>
                  <span className="rv-info-value">{modalVerActual.sala}</span>
                </div>
                <div className="rv-info-block">
                  <span className="rv-info-label">Fecha</span>
                  <span className="rv-info-value">{formatFecha(modalVerActual.fecha)}</span>
                </div>
                <div className="rv-info-block">
                  <span className="rv-info-label">Hora</span>
                  <span className="rv-info-value">{modalVerActual.hora}</span>
                </div>
                <div className="rv-info-block">
                  <span className="rv-info-label">Personas</span>
                  <span className="rv-info-value">{modalVerActual.personas}</span>
                </div>
                <div className="rv-info-block">
                  <span className="rv-info-label">Canal</span>
                  <span className="rv-info-value">{modalVerActual.canal}</span>
                </div>
                <div className="rv-info-block">
                  <span className="rv-info-label">Estado</span>
                  <span className={estadoBadgeClass(modalVerActual.estado)}>
                    <span className="status-indicator-dot"></span> {modalVerActual.estado}
                  </span>
                </div>
                <div className="rv-info-block">
                  <span className="rv-info-label">Pago</span>
                  <span className={pagoBadgeClass(modalVerActual.pago)}>
                    <i className="fa-solid fa-wallet icon-wallet"></i> {modalVerActual.pago}
                  </span>
                </div>
                <div className="rv-payment-summary rv-info-block--full">
                  <div className="rv-payment-item">
                    <span className="rv-payment-label-row">
                      Total reserva
                      {resumenModal.descuentoPorcentaje > 0 && (
                        <small className={`rv-discount-badge rv-discount-badge--${resumenModal.descuentoPorcentaje}`}>
                          {resumenModal.descuentoPorcentaje}% OFF
                        </small>
                      )}
                    </span>
                    <strong>$ {resumenModal.totalReserva.toLocaleString('es-AR')}</strong>
                  </div>
                  <div className="rv-payment-item">
                    <span>Seña pagada</span>
                    <strong>$ {resumenModal.seniaPagada.toLocaleString('es-AR')}</strong>
                  </div>
                  <div className="rv-payment-item">
                    <span>Saldo por abonar</span>
                    <strong>$ {resumenModal.saldo.toLocaleString('es-AR')}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="rv-modal-footer">
              {puedeGenerarPagoRapido && (
                <button className="rv-btn-payment" onClick={() => generarPagoDesdeReserva(modalVerActual)}>
                  <i className="fa-solid fa-money-bill-transfer"></i> Generar pago
                </button>
              )}
              <button className="rv-btn-secondary" onClick={() => setModalVer(null)}>Cerrar</button>
              <button className="rv-btn-primary" onClick={() => { setModalVer(null); abrirEditar(modalVerActual); }}>
                <i className="fa-solid fa-pen"></i> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEditar && (
        <div className="rv-modal-overlay" onClick={() => setModalEditar(null)}>
          <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rv-modal-header">
              <h2>Editar Reserva <span className="rv-modal-id">{modalEditar.id}</span></h2>
              <button className="rv-modal-close" onClick={() => setModalEditar(null)}>X</button>
            </div>
            <div className="rv-modal-body">
              <div className="rv-form-grid">
                <div className="rv-form-field rv-form-field--full">
                  <label className="rv-form-label">Cliente</label>
                  <input className="rv-form-input" value={formEditar.cliente}
                    onChange={(e) => setFormEditar({ ...formEditar, cliente: e.target.value })} />
                </div>
                <div className="rv-form-field">
                  <label className="rv-form-label">Telefono</label>
                  <input className="rv-form-input" value={formEditar.telefono || ''}
                    onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })} />
                </div>
                <div className="rv-form-field">
                  <label className="rv-form-label">Sala</label>
                  <select className="rv-form-input" value={formEditar.sala}
                    onChange={(e) => setFormEditar({ ...formEditar, sala: e.target.value, hora: roomSchedules[e.target.value]?.[0] || formEditar.hora })}>
                    {escapeRooms.map((room) => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
                <div className="rv-form-field">
                  <label className="rv-form-label">Fecha</label>
                  {/* input type=date trabaja siempre en formato ISO AAAA-MM-DD */}
                  <input type="date" className="rv-form-input" value={formEditar.fecha}
                    onChange={(e) => setFormEditar({ ...formEditar, fecha: e.target.value })} />
                </div>
                <div className="rv-form-field">
                  <label className="rv-form-label">Hora</label>
                  <select className="rv-form-input" value={formEditar.hora}
                    onChange={(e) => setFormEditar({ ...formEditar, hora: e.target.value })}>
                    {(roomSchedules[formEditar.sala] || []).map((hora) => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>
                <div className="rv-form-field">
                  <label className="rv-form-label">Personas</label>
                  <input type="number" className="rv-form-input" value={formEditar.personas}
                    onChange={(e) => setFormEditar({ ...formEditar, personas: Number(e.target.value) })} />
                </div>
                <div className="rv-form-field">
                  <label className="rv-form-label">Canal</label>
                  <select className="rv-form-input" value={formEditar.canal}
                    onChange={(e) => setFormEditar({ ...formEditar, canal: e.target.value })}>
                    <option>Web</option>
                    <option>WhatsApp</option>
                    <option>Telefonico</option>
                    <option>Presencial</option>
                  </select>
                </div>
                <div className="rv-form-field">
                  <label className="rv-form-label">Estado</label>
                  <select className="rv-form-input" value={formEditar.estado}
                    onChange={(e) => setFormEditar({ ...formEditar, estado: e.target.value })}>
                    <option>Confirmada</option>
                    <option>Pendiente</option>
                    <option>Completada</option>
                    <option>Cancelada</option>
                  </select>
                </div>
                <div className="rv-form-field">
                  <label className="rv-form-label">Pago</label>
                  <select className="rv-form-input" value={formEditar.pago}
                    onChange={(e) => setFormEditar({ ...formEditar, pago: e.target.value })}>
                    <option>Pagado</option>
                    <option>No Pagado</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="rv-modal-footer">
              <button
                className="rv-btn-danger rv-btn-danger--left"
                onClick={() => {
                  setModalEliminar(modalEditar);
                  setModalEditar(null);
                }}
              >
                <i className="fa-solid fa-trash"></i> Eliminar
              </button>
              <button className="rv-btn-secondary" onClick={() => setModalEditar(null)}>Cancelar</button>
              <button className="rv-btn-primary" onClick={guardarEdicion}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {modalEliminar && (
        <div className="rv-modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="rv-modal rv-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="rv-modal-header rv-modal-header--danger">
              <h2>Eliminar Reserva</h2>
              <button className="rv-modal-close" onClick={() => setModalEliminar(null)}>X</button>
            </div>
            <div className="rv-modal-body">
              <div className="rv-eliminar-preview">
                <FontAwesomeIcon className="rv-eliminar-icon" icon={faTrash} />
                <p className="rv-eliminar-text">
                  Estas por eliminar la reserva <strong>{modalEliminar.id}</strong> de{' '}
                  <strong>{modalEliminar.cliente}</strong> para el {formatFecha(modalEliminar.fecha)} a las {modalEliminar.hora}.
                </p>
                <p className="rv-eliminar-warn">Esta accion no se puede deshacer.</p>
              </div>
            </div>
            <div className="rv-modal-footer">
              <button className="rv-btn-secondary" onClick={() => setModalEliminar(null)}>Cancelar</button>
              <button className="rv-btn-danger" onClick={confirmarEliminar}>
                <i className="fa-solid fa-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
