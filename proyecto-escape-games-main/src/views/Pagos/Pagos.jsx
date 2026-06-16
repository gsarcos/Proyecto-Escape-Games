// src/views/Pagos/Pagos.jsx
import { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import CajaChica from './components/CajaChica/CajaChica';
import './Pagos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { calcularResumenPagoReserva } from '../../utils/reservasFinanzas';

const ESTADOS_PAGO = ['Pagado', 'Reembolsado'];
const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Mercado Pago', 'Transferencia'];


const estadoClass = (estado) => ({
  Pagado: 'badge badge--pagado',
  Reembolsado: 'badge badge--reembolsado',
}[estado] || 'badge');

const tipoClass = (tipo) => (
  tipo === 'Ingreso' ? 'badge badge--ingreso' : 'badge badge--egreso'
);

const estadoFacturacionPorMetodo = (metodo) => (
  metodo === 'Tarjeta' ? 'Facturado' : 'Pendiente'
);

const fechaHoy = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const crearFormVacio = () => ({
  cliente: '',
  reservaId: '',
  sala: '',
  monto: '',
  tipo: 'Ingreso',
  metodo: 'Efectivo',
  estado: 'Pagado',
  fecha: fechaHoy(),
});

export default function Pagos() {
  const {
    payments = [],
    setPayments,
    reservations = [],
    setReservations,
    paymentDraft,
    setPaymentDraft,
    triggerToast,
  } = useContext(AppContext);

  const [tab, setTab] = useState('movimientos');
  const [modalEditar, setModalEditar] = useState(null);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [formEditar, setFormEditar] = useState({});
  const [formNuevo, setFormNuevo] = useState(crearFormVacio);
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState(fechaHoy);
  const [fechaHasta, setFechaHasta] = useState(fechaHoy);

  const clientesReservas = useMemo(() => (
    [...new Set(reservations.map((reserva) => reserva.cliente).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
  ), [reservations]);

  const reservasPorId = useMemo(() => {
    const mapa = new Map();
    reservations.forEach((reserva) => {
      if (reserva.id) mapa.set(reserva.id, reserva);
    });
    return mapa;
  }, [reservations]);

  const generarPagoId = () => {
    const max = payments.reduce((acc, pago) => {
      const match = String(pago.id || '').match(/PAG-(\d+)/);
      return match ? Math.max(acc, Number(match[1])) : acc;
    }, 0);
    return `PAG-${String(max + 1).padStart(4, '0')}`;
  };

  const abrirAgregar = () => {
    setFormNuevo(crearFormVacio());
    setModalAgregar(true);
  };

  useEffect(() => {
    if (!paymentDraft) return;

    setFormNuevo({
      ...crearFormVacio(),
      ...paymentDraft,
      tipo: paymentDraft.tipo || 'Ingreso',
      fecha: paymentDraft.fecha || fechaHoy(),
    });
    setModalAgregar(true);
    setPaymentDraft(null);
  }, [paymentDraft, setPaymentDraft]);

  const abrirEditar = (pago) => {
    setFormEditar({ ...pago, estado: ESTADOS_PAGO.includes(pago.estado) ? pago.estado : 'Pagado' });
    setModalEditar(pago);
  };

  const actualizarReservaIdNuevo = (reservaId) => {
    const reserva = reservasPorId.get(reservaId);
    setFormNuevo((prev) => ({
      ...prev,
      reservaId,
      cliente: reserva ? reserva.cliente : prev.cliente,
      sala: reserva ? reserva.sala : prev.sala,
    }));
  };

  const reservaIdConOtroCliente = () => {
    if (!formNuevo.reservaId) return null;
    const reserva = reservasPorId.get(formNuevo.reservaId);
    if (!reserva) return null;
    const clienteReserva = reserva.cliente?.trim().toLowerCase();
    const clienteForm = formNuevo.cliente?.trim().toLowerCase();
    return clienteReserva && clienteForm && clienteReserva !== clienteForm ? reserva : null;
  };

  const sincronizarReservaPorIngreso = (pago, pagosActualizados) => {
    if (pago.tipo !== 'Ingreso' || !pago.reservaId || !reservasPorId.has(pago.reservaId)) return;

    setReservations((prev) => prev.map((reserva) => (
      reserva.id === pago.reservaId
        ? (() => {
            const resumen = calcularResumenPagoReserva(reserva, pagosActualizados);
            return {
              ...reserva,
              estado: resumen.estaSaldada ? 'Completada' : 'Confirmada',
              pago: resumen.estaSaldada ? 'Pagado' : 'No Pagado',
            };
          })()
        : reserva
    )));
  };

  const pagoEnRango = (pago) => {
    const inicio = fechaDesde <= fechaHasta ? fechaDesde : fechaHasta;
    const fin = fechaDesde <= fechaHasta ? fechaHasta : fechaDesde;
    return pago.fecha >= inicio && pago.fecha <= fin;
  };

  const pagoCoincideBusqueda = (pago) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    const reserva = reservasPorId.get(pago.reservaId);
    return (
      pago.cliente?.toLowerCase().includes(texto) ||
      pago.reservaId?.toLowerCase().includes(texto) ||
      pago.id?.toLowerCase().includes(texto) ||
      pago.concepto?.toLowerCase().includes(texto) ||
      pago.descripcion?.toLowerCase().includes(texto) ||
      pago.sala?.toLowerCase().includes(texto) ||
      reserva?.sala?.toLowerCase().includes(texto)
    );
  };

  const pagosFiltrados = payments.filter((pago) => pagoEnRango(pago) && pagoCoincideBusqueda(pago));

  const guardarEdicion = () => {
    setPayments((prev) => prev.map((pago) => (
      pago.id === formEditar.id ? { ...formEditar, monto: Number(formEditar.monto) } : pago
    )));
    setModalEditar(null);
    triggerToast('Pago actualizado correctamente');
  };

  const guardarNuevo = () => {
    if (!formNuevo.cliente || !formNuevo.monto || !formNuevo.fecha) {
      triggerToast('Completa cliente, monto y fecha');
      return;
    }

    const reservaConError = reservaIdConOtroCliente();
    if (reservaConError) {
      triggerToast(`El ID ${formNuevo.reservaId} pertenece a ${reservaConError.cliente}`);
      return;
    }

    const nuevo = {
      ...formNuevo,
      id: generarPagoId(),
      monto: Number(formNuevo.monto),
      estado: formNuevo.tipo === 'Ingreso' ? 'Pagado' : formNuevo.estado,
      facturacionEstado: formNuevo.tipo === 'Ingreso'
        ? estadoFacturacionPorMetodo(formNuevo.metodo)
        : undefined,
      concepto: formNuevo.concepto || `${formNuevo.tipo === 'Ingreso' ? 'Pago' : 'Movimiento'} ${formNuevo.reservaId || ''}`.trim(),
      descripcion: formNuevo.descripcion || `${formNuevo.tipo === 'Ingreso' ? 'Pago de reserva' : 'Egreso registrado'} ${formNuevo.reservaId || ''}`.trim(),
    };

    const pagosActualizados = [nuevo, ...payments];
    setPayments(pagosActualizados);
    sincronizarReservaPorIngreso(nuevo, pagosActualizados);
    setModalAgregar(false);
    setFormNuevo(crearFormVacio());
    triggerToast('Pago registrado correctamente');
  };

  const totalIngresos = pagosFiltrados
    .filter((pago) => pago.tipo === 'Ingreso' && pago.estado === 'Pagado')
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
  const totalEgresos = pagosFiltrados
    .filter((pago) => pago.tipo === 'Egreso')
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
  const reservaConError = reservaIdConOtroCliente();


  

  const totalEfectivo = pagosFiltrados
    .filter((pago) => pago.metodo === 'Efectivo' && pago.tipo === 'Ingreso' && pago.estado === 'Pagado')
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);

  return (
    <div className="pg-container">
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Pagos</h1>
          <p className="pg-subtitle">Control administrativo de transacciones</p>
        </div>
        <button className="btn-primary" onClick={abrirAgregar}>
          + Registrar pago
        </button>
      </div>

      <div className="pg-kpis">
        {[
          { label: 'Ingresos', value: totalIngresos, accent: '#22c55e' },
          { label: 'Egresos', value: totalEgresos, accent: '#ef4444' },
          { label: 'Caja Efectivo', value: totalEfectivo, accent: '#f59e0b' },
          { label: 'Neto', value: totalIngresos - totalEgresos, accent: '#6366f1' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="pg-kpi" style={{ borderLeftColor: accent }}>
            <span className="pg-kpi-label">{label}</span>
            <span className="pg-kpi-value">$ {Number(value).toLocaleString('es-AR')}</span>
          </div>
        ))}
      </div>

      <div className="pg-tools">
        <div className="pg-search-wrapper">
          <i className="fa-solid fa-magnifying-glass pg-search-icon"></i>
          <input
            type="text"
            placeholder="Buscar por cliente, sala o ID de reserva..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className="pg-search-input"
          />
        </div>
        <div className="pg-date-range">
          <label>
            Desde
            <input
              type="date"
              value={fechaDesde}
              onChange={(event) => setFechaDesde(event.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={fechaHasta}
              onChange={(event) => setFechaHasta(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="pg-tabs">
        {['movimientos', 'caja'].map((item) => (
          <button
            key={item}
            className={`pg-tab ${tab === item ? 'pg-tab--active' : ''}`}
            onClick={() => setTab(item)}
          >
            {item === 'movimientos' ? 'Movimientos' : 'Caja Chica'}
          </button>
        ))}
      </div>

      {tab === 'movimientos' ? (
        <div className="pg-tabla-wrapper">
          <table className="pg-tabla">
            <thead>
              <tr>
                <th>ID</th><th>Reserva</th><th>Cliente</th><th>Detalle</th><th>Monto</th>
                <th>Tipo</th><th>Metodo</th><th>Estado</th><th>Fecha</th><th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {pagosFiltrados.length === 0 ? (
                <tr><td colSpan={10} className="pg-empty">No hay pagos registrados</td></tr>
              ) : pagosFiltrados.map((pago) => (
                <tr key={pago.id}>
                  <td className="td-mono">{pago.id}</td>
                  <td className="td-mono">{pago.reservaId || '-'}</td>
                  <td className="td-bold">{pago.cliente}</td>
                  <td>{pago.descripcion || pago.concepto || pago.sala || '-'}</td>
                  <td className="td-monto">$ {Number(pago.monto).toLocaleString('es-AR')}</td>
                  <td><span className={tipoClass(pago.tipo)}>{pago.tipo}</span></td>
                  <td>{pago.metodo}</td>
                  <td><span className={estadoClass(pago.estado)}>{pago.estado}</span></td>
                  <td>{pago.fecha}</td>
                  <td>
                    <button className="rv-btn rv-btn--editar" title="Editar pago" onClick={() => abrirEditar(pago)}>
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <CajaChica payments={pagosFiltrados} />
      )}

      {modalAgregar && (
        <div className="modal-overlay" onClick={() => setModalAgregar(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Pago</h2>
              <button className="modal-close" onClick={() => setModalAgregar(false)}>X</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field form-field--full">
                  <label className="form-label">Tipo</label>
                  <select
                    className="form-input"
                    value={formNuevo.tipo}
                    onChange={(e) => setFormNuevo((prev) => ({
                      ...prev,
                      tipo: e.target.value,
                      estado: e.target.value === 'Ingreso' ? 'Pagado' : prev.estado,
                    }))}
                  >
                    <option>Ingreso</option>
                    <option>Egreso</option>
                  </select>
                </div>

                <div className="form-field form-field--full">
                  <label className="form-label">Cliente</label>
                  <input
                    className="form-input"
                    placeholder="Nombre del cliente"
                    list="clientes-list"
                    value={formNuevo.cliente}
                    onChange={(e) => setFormNuevo((prev) => ({ ...prev, cliente: e.target.value }))}
                  />
                  <datalist id="clientes-list">
                    {clientesReservas.map((cliente) => (
                      <option key={cliente} value={cliente} />
                    ))}
                  </datalist>
                </div>

                <div className="form-field">
                  <label className="form-label">ID Reserva (opcional)</label>
                  <input
                    className="form-input"
                    placeholder="Ej: HIST-0001"
                    list="reservas-list"
                    value={formNuevo.reservaId}
                    onChange={(e) => actualizarReservaIdNuevo(e.target.value)}
                  />
                  <datalist id="reservas-list">
                    {reservations.map((reserva) => (
                      <option key={reserva.id} value={reserva.id}>{reserva.cliente}</option>
                    ))}
                  </datalist>
                  {reservaConError && (
                    <span className="form-hint form-hint--error">
                      Ese ID pertenece a {reservaConError.cliente}.
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">Sala</label>
                  <input
                    className="form-input"
                    placeholder="Sala"
                    value={formNuevo.sala}
                    onChange={(e) => setFormNuevo((prev) => ({ ...prev, sala: e.target.value }))}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Monto ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={formNuevo.monto}
                    onChange={(e) => setFormNuevo((prev) => ({ ...prev, monto: e.target.value }))}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Metodo de pago</label>
                  <select
                    className="form-input"
                    value={formNuevo.metodo}
                    onChange={(e) => setFormNuevo((prev) => ({ ...prev, metodo: e.target.value }))}
                  >
                    {METODOS_PAGO.map((metodo) => <option key={metodo}>{metodo}</option>)}
                  </select>
                </div>

                <div className="form-field form-field--full">
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formNuevo.fecha}
                    onChange={(e) => setFormNuevo((prev) => ({ ...prev, fecha: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalAgregar(false)}>Cancelar</button>
              <button className="btn-primary" onClick={guardarNuevo}>Registrar pago</button>
            </div>
          </div>
        </div>
      )}

      {modalEditar && (
        <div className="modal-overlay" onClick={() => setModalEditar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Pago</h2>
              <button className="modal-close" onClick={() => setModalEditar(null)}>X</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field form-field--full">
                  <label className="form-label">Cliente</label>
                  <input
                    className="form-input"
                    value={formEditar.cliente}
                    onChange={(e) => setFormEditar({ ...formEditar, cliente: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Monto</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formEditar.monto}
                    onChange={(e) => setFormEditar({ ...formEditar, monto: Number(e.target.value) })}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Tipo</label>
                  <select className="form-input" value={formEditar.tipo}
                    onChange={(e) => setFormEditar({ ...formEditar, tipo: e.target.value })}>
                    <option>Ingreso</option>
                    <option>Egreso</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Metodo de pago</label>
                  <select className="form-input" value={formEditar.metodo}
                    onChange={(e) => setFormEditar({ ...formEditar, metodo: e.target.value })}>
                    {METODOS_PAGO.map((metodo) => <option key={metodo}>{metodo}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Estado</label>
                  <select className="form-input" value={formEditar.estado}
                    onChange={(e) => setFormEditar({ ...formEditar, estado: e.target.value })}>
                    {ESTADOS_PAGO.map((estado) => <option key={estado}>{estado}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Fecha</label>
                  <input type="date" className="form-input" value={formEditar.fecha}
                    onChange={(e) => setFormEditar({ ...formEditar, fecha: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalEditar(null)}>Cancelar</button>
              <button className="btn-primary" onClick={guardarEdicion}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
