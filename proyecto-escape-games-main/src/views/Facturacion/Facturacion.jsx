import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import MetricCard from '../../components/MetricCard/MetricCard';
import { estaCancelada, resumenFacturacionReserva } from '../../utils/facturacion';
import './Facturacion.css';

const fechaIsoLocal = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const inicioMesActual = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-01`;

const formatFecha = (fecha) => {
  if (!fecha) return '';
  const [anio, mes, dia] = String(fecha).split('-');
  return `${dia}/${mes}/${anio}`;
};

const perteneceAlRango = (fecha, desde, hasta) => {
  if (!fecha || !desde || !hasta) return false;
  const inicio = desde <= hasta ? desde : hasta;
  const fin = desde <= hasta ? hasta : desde;
  return fecha >= inicio && fecha <= fin;
};

export default function Facturacion() {
  const { reservations = [], payments = [], setReservations, triggerToast } = useContext(AppContext);
  const filtroPago = 'Todos';
  const hoy = new Date();
  const [fechaDesde, setFechaDesde] = useState(inicioMesActual(hoy));
  const [fechaHasta, setFechaHasta] = useState(fechaIsoLocal(hoy));
  const periodoLabel = `del ${formatFecha(fechaDesde)} al ${formatFecha(fechaHasta)}`;

  const reservasDelPeriodo = useMemo(
    () => reservations.filter((res) => perteneceAlRango(res.fecha, fechaDesde, fechaHasta)),
    [reservations, fechaDesde, fechaHasta]
  );

  const pagosDelPeriodo = useMemo(
    () => payments.filter((pago) => perteneceAlRango(pago.fecha, fechaDesde, fechaHasta)),
    [payments, fechaDesde, fechaHasta]
  );

  const facturadoPeriodo = reservasDelPeriodo.reduce((acc, res) => {
    if (estaCancelada(res)) return acc;
    return acc + resumenFacturacionReserva(res, payments).facturado;
  }, 0);

  const pendienteFacturar = reservasDelPeriodo.reduce((acc, res) => {
    if (estaCancelada(res)) return acc;
    return acc + resumenFacturacionReserva(res, payments).pendiente;
  }, 0);

  const efectivoNoFacturable = pagosDelPeriodo.reduce((acc, pago) => {
    const esIngresoEfectivo = pago.tipo === 'Ingreso' && pago.metodo === 'Efectivo';
    const estaPagado = pago.estado === 'Pagado';
    return esIngresoEfectivo && estaPagado ? acc + Number(pago.monto || 0) : acc;
  }, 0);

  const registrosFiltrados = reservasDelPeriodo.filter((res) => {
    if (filtroPago === 'Todos') return true;
    const resumen = resumenFacturacionReserva(res, payments);
    if (filtroPago === 'Pagado') return resumen.estaFacturada;
    return !resumen.estaFacturada && !estaCancelada(res);
  });

  const marcarFacturado = (reservaId) => {
    const hoyIso = new Date().toISOString().slice(0, 10);

    setReservations((prev) => prev.map((res) => (
      res.id === reservaId
        ? { ...res, facturado: true, fechaFacturacion: hoyIso }
        : res
    )));

    triggerToast?.('Reserva marcada como facturada');
  };

  return (
    <div className="facturacion-view-container">
      <header className="facturacion-header">
        <div className="header-left">
          <h1>Control de Facturacion</h1>
          <p className="subtitle">Control mensual de reservas facturadas, pendientes y no aplicables</p>
        </div>
        <button className="btn-cierre-caja" onClick={() => alert('Cierre de caja exportado al sistema contable.')}>
          <i className="fa-solid fa-vault"></i> Realizar Cierre de Caja
        </button>
      </header>

      <section className="periodo-card" aria-label="Seleccion de periodo">
        <div>
          <h2>Periodo de control</h2>
          <p>Mostrando facturacion de {periodoLabel}</p>
        </div>
        <div className="periodo-controles">
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
      </section>

      <div className="financial-metrics-grid">
        <MetricCard
          label="FACTURADO EN PERIODO"
          value={`$${facturadoPeriodo.toLocaleString('es-AR')}`}
        />
        <MetricCard
          label="PENDIENTE FACTURAR"
          value={`$${pendienteFacturar.toLocaleString('es-AR')}`}
        />
        <MetricCard
          label="EFECTIVO"
          value={`$${efectivoNoFacturable.toLocaleString('es-AR')}`}
        />
      </div>

      <div className="table-container">
        <div className="table-title-row">
          <h2>Listado de control - {periodoLabel}</h2>
          <span>{registrosFiltrados.length} reservas</span>
        </div>
        <table className="facturacion-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th>DESCRIPCION</th>
              <th>MONTO</th>
              <th>COMO FACTURAR</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((res) => {
                const resumen = resumenFacturacionReserva(res, payments);
                const esNoAplica = estaCancelada(res);
                const esSaldado = !esNoAplica && resumen.estaFacturada;
                const estaPendiente = !esNoAplica && resumen.pendiente > 0;
                const montoAMostrar = esSaldado ? resumen.facturado : resumen.pendiente;
                const conceptoDesc = esNoAplica
                  ? `Reserva cancelada ${res.id || ''}`
                  : esSaldado && resumen.pendiente > 0
                    ? `Facturado parcial ${res.id || ''}`
                    : esSaldado
                      ? `Facturado reserva ${res.id || ''}`
                      : `Proximo a facturar ${res.id || ''}`;
                const estadoTexto = esNoAplica
                  ? 'No aplica'
                  : esSaldado && resumen.pendiente > 0
                    ? 'Facturado parcial'
                    : esSaldado
                      ? 'Facturado'
                      : 'Pendiente de facturar';
                const estadoClase = esNoAplica ? 'no-aplica' : esSaldado ? 'facturado' : 'pendiente';
                const metodoClase = 'web';
                const metodoTexto = 'Web - Facturante';

                return (
                  <tr key={res.id}>
                    <td>{res.fecha}</td>
                    <td>{conceptoDesc} - {res.sala} ({res.cliente})</td>
                    <td className="txt-monto">${montoAMostrar.toLocaleString('es-AR')}</td>
                    <td>
                      <span className={`badge-metodo ${metodoClase}`}>{metodoTexto}</span>
                    </td>
                    <td>
                      <span className={`badge-estado ${estadoClase}`}>
                        {estadoTexto}
                      </span>
                    </td>
                    <td className="text-right">
                      {estaPendiente ? (
                        <button
                          className="btn-marcar-facturado"
                          onClick={() => marcarFacturado(res.id)}
                        >
                          <i className="fa-solid fa-check"></i> Marcar facturado
                        </button>
                      ) : esSaldado ? (
                        <span className="check-facturado-icon">
                          <i className="fa-solid fa-circle-check"></i>
                        </span>
                      ) : (
                        <span className="no-aplica-icon">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center empty-row">
                  No hay reservas registradas para este periodo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="cierre-rapido-section">
        <h2>Control Rapido de Caja Chica</h2>
        <div className="cierre-grid-inputs">
          <div className="input-fin-group">
            <label>Efectivo Inicial (Apertura)</label>
            <input type="text" placeholder="$15.000" disabled />
          </div>
          <div className="input-fin-group">
            <label>Ingresos Declarados en Turno</label>
            <input type="text" value={`$${facturadoPeriodo.toLocaleString('es-AR')}`} disabled />
          </div>
          <div className="input-fin-group">
            <label>Retiros / Gastos de Caja</label>
            <input type="number" placeholder="Ej: $1.200 (Art. Limpieza)" />
          </div>
        </div>
      </section>
    </div>
  );
}
