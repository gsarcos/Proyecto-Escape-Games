import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import MetricCard from '../../components/MetricCard/MetricCard';
// Usamos el calculador de precio con descuentos para saber cuánto vale la reserva
import { calcularPrecioReserva } from '../../utils/reservasFinanzas';
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

  // 1. FACTURADO: Suma del valor real (con descuentos) de las reservas confirmadas como facturadas manuales
  const facturadoPeriodo = reservasDelPeriodo.reduce((acc, res) => {
    if (res.estado === 'Cancelada' || !res.facturado) return acc;
    return acc + calcularPrecioReserva(res);
  }, 0);

  // 2. PENDIENTE FACTURAR: Solo resta cuando res.facturado pasa a ser true mediante el botón
  const pendienteFacturar = reservasDelPeriodo.reduce((acc, res) => {
    if (res.estado === 'Cancelada' || res.facturado) return acc;
    return acc + calcularPrecioReserva(res);
  }, 0);

  const efectivoNoFacturable = pagosDelPeriodo.reduce((acc, pago) => {
    const esIngresoEfectivo = pago.tipo === 'Ingreso' && pago.metodo === 'Efectivo';
    const estaPagado = pago.estado === 'Pagado';
    return esIngresoEfectivo && estaPagado ? acc + Number(pago.monto || 0) : acc;
  }, 0);

  const registrosFiltrados = reservasDelPeriodo;

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
              <th>MONTO RESERVA</th>
              <th>COMO FACTURAR</th>
              <th>ESTADO CONTABLE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((res) => {
                const esNoAplica = res.estado === 'Cancelada';
                const esSaldadoContable = !!res.facturado;
                const estaPendienteContable = !esNoAplica && !esSaldadoContable;

                const montoTotalReserva = calcularPrecioReserva(res);
                
                const conceptoDesc = esNoAplica
                  ? `Reserva cancelada ${res.id || ''}`
                  : esSaldadoContable
                    ? `Facturado reserva ${res.id || ''}`
                    : `Proximo a facturar ${res.id || ''}`;
                    
                const estadoTexto = esNoAplica
                  ? 'No aplica'
                  : esSaldadoContable
                    ? 'Facturado'
                    : 'Pendiente de facturar';
                    
                const estadoClase = esNoAplica ? 'no-aplica' : esSaldadoContable ? 'facturado' : 'pendiente';
                const metodoTexto = 'Web - Facturante';

                return (
                  <tr key={res.id}>
                    <td>{res.fecha}</td>
                    <td>{conceptoDesc} - {res.sala} ({res.cliente})</td>
                    <td className="txt-monto">${montoTotalReserva.toLocaleString('es-AR')}</td>
                    <td>
                      <span className={`badge-metodo web`}>{metodoTexto}</span>
                    </td>
                    <td>
                      <span className={`badge-estado ${estadoClase}`}>
                        {estadoTexto}
                      </span>
                    </td>
                    <td className="text-right">
                      {estaPendienteContable ? (
                        <button
                          className="btn-marcar-facturado"
                          onClick={() => marcarFacturado(res.id)}
                        >
                          <i className="fa-solid fa-check"></i> Marcar facturado
                        </button>
                      ) : esSaldadoContable ? (
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
    </div>
  );
}