import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import './Reportes.css';

const fechaIsoLocal = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const parseFecha = (fecha) => {
  const [anio, mes, dia] = String(fecha).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};

const formatFecha = (fecha) => {
  const [anio, mes, dia] = String(fecha).split('-');
  return `${dia}/${mes}/${anio}`;
};

const inicioSemana = (fechaIso) => {
  const fecha = parseFecha(fechaIso);
  const dia = fecha.getDay() || 7;
  fecha.setDate(fecha.getDate() - dia + 1);
  return fechaIsoLocal(fecha);
};

const finSemana = (fechaIso) => {
  const inicio = parseFecha(inicioSemana(fechaIso));
  inicio.setDate(inicio.getDate() + 6);
  return fechaIsoLocal(inicio);
};

const nombreArchivo = (desde, hasta) => `reporte-semanal-${desde}_${hasta}`;

const crearReporte = (desde, hasta, reservas = [], pagos = []) => {
  const reservasPeriodo = reservas.filter((reserva) => reserva.fecha >= desde && reserva.fecha <= hasta);
  const pagosPeriodo = pagos.filter((pago) => pago.fecha >= desde && pago.fecha <= hasta);
  const ingresos = pagosPeriodo
    .filter((pago) => pago.tipo === 'Ingreso' && pago.estado === 'Pagado')
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
  const egresos = pagosPeriodo
    .filter((pago) => pago.tipo === 'Egreso')
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);

  return {
    id: `${desde}-${hasta}`,
    desde,
    hasta,
    titulo: `Reporte semanal ${formatFecha(desde)} al ${formatFecha(hasta)}`,
    archivo: nombreArchivo(desde, hasta),
    reservas: reservasPeriodo.length,
    ingresos,
    egresos,
  };
};

export default function Reportes() {
  const { reservations = [], payments = [], triggerToast } = useContext(AppContext);
  const hoyIso = fechaIsoLocal(new Date());
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(inicioSemana(hoyIso));
  const [fechaHasta, setFechaHasta] = useState(hoyIso);
  const [reportesManuales, setReportesManuales] = useState([]);
  const [exportacionCorrecta, setExportacionCorrecta] = useState(null);

  const reportesAutomaticos = useMemo(() => {
    const semanas = new Map();

    reservations.forEach((reserva) => {
      if (!reserva.fecha) return;
      const desde = inicioSemana(reserva.fecha);
      const hasta = finSemana(reserva.fecha);
      const semanaCerrada = parseFecha(hasta).getTime() < parseFecha(hoyIso).getTime();
      if (semanaCerrada) semanas.set(desde, { desde, hasta });
    });

    return Array.from(semanas.values())
      .map(({ desde, hasta }) => crearReporte(desde, hasta, reservations, payments))
      .sort((a, b) => b.desde.localeCompare(a.desde));
  }, [reservations, payments, hoyIso]);

  const reportes = [...reportesManuales, ...reportesAutomaticos]
    .sort((a, b) => b.desde.localeCompare(a.desde));

  const avisarExportacion = (reporte, formato) => {
    setExportacionCorrecta({ archivo: reporte.archivo, formato });
    triggerToast?.(`Exportacion ${formato} preparada para ${reporte.archivo}`);
  };

  const generarManual = (formato) => {
    const desde = fechaDesde <= fechaHasta ? fechaDesde : fechaHasta;
    const hasta = fechaDesde <= fechaHasta ? fechaHasta : fechaDesde;
    const nuevoReporte = {
      ...crearReporte(desde, hasta, reservations, payments),
      id: `manual-${Date.now()}`,
      titulo: `Reporte personalizado ${formatFecha(desde)} al ${formatFecha(hasta)}`,
      archivo: `reporte-personalizado-${desde}_${hasta}`,
    };

    setReportesManuales((prev) => [nuevoReporte, ...prev]);
    setModalAbierto(false);
    avisarExportacion(nuevoReporte, formato);
  };

  return (
    <div className="reportes-container">
      <header className="reportes-header">
        <div>
          <h1>Reportes</h1>
          <p>Historico semanal generado automaticamente posterior a cada semana</p>
        </div>
        <button className="reportes-primary" onClick={() => setModalAbierto(true)}>
          <i className="fa-solid fa-file-circle-plus"></i> Generar nuevo reporte
        </button>
      </header>

      <section className="reportes-summary">
        <div>
          <span className="reportes-summary-label">Reportes disponibles</span>
          <strong>{reportes.length}</strong>
        </div>
        <div>
          <span className="reportes-summary-label">Ultima semana cerrada</span>
          <strong>{reportes[0] ? `${formatFecha(reportes[0].desde)} - ${formatFecha(reportes[0].hasta)}` : '-'}</strong>
        </div>
      </section>

      {exportacionCorrecta && (
        <button className="reportes-export-ok" type="button">
          <i className="fa-solid fa-circle-check"></i>
          Exportado correctamente
          <span>{exportacionCorrecta.formato} - {exportacionCorrecta.archivo}</span>
        </button>
      )}

      <section className="reportes-list">
        <div className="reportes-list-header">
          <h2>Reportes semanales</h2>
          <span>Mas reciente arriba</span>
        </div>

        {reportes.length === 0 ? (
          <div className="reportes-empty">No hay semanas cerradas para reportar.</div>
        ) : reportes.map((reporte) => (
          <article className="reporte-row" key={reporte.id}>
            <div className="reporte-info">
              <h3>{reporte.titulo}</h3>
              <p>{reporte.archivo}</p>
            </div>
            <div className="reporte-meta">
              <span>{reporte.reservas} reservas</span>
              <span>Ingresos $ {reporte.ingresos.toLocaleString('es-AR')}</span>
              <span>Egresos $ {reporte.egresos.toLocaleString('es-AR')}</span>
            </div>
            <div className="reporte-actions">
              <button onClick={() => avisarExportacion(reporte, 'CSV')}>CSV</button>
              <button onClick={() => avisarExportacion(reporte, 'PDF')}>PDF</button>
            </div>
          </article>
        ))}
      </section>

      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal reportes-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Generar nuevo reporte</h2>
              <button className="modal-close" onClick={() => setModalAbierto(false)}>X</button>
            </div>
            <div className="modal-body">
              <div className="reportes-date-grid">
                <label>
                  Desde
                  <input type="date" value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} />
                </label>
                <label>
                  Hasta
                  <input type="date" value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)} />
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button className="btn-secondary" onClick={() => generarManual('CSV')}>Exportar CSV</button>
              <button className="btn-primary" onClick={() => generarManual('PDF')}>Exportar PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
