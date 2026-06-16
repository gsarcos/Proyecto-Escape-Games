import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { estaCancelada, resumenFacturacionReserva } from '../../utils/facturacion';
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

const moneda = (valor) => `$ ${Number(valor || 0).toLocaleString('es-AR')}`;

const escapeHtml = (valor) => String(valor ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const descargarArchivo = (contenido, nombre, tipo) => {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const filtrarPorRango = (items = [], desde, hasta) => (
  items.filter((item) => item.fecha >= desde && item.fecha <= hasta)
);

const filasFacturacion = (reservas = [], pagos = []) => reservas.map((reserva) => {
  const resumen = resumenFacturacionReserva(reserva, pagos);
  const cancelada = estaCancelada(reserva);
  const estado = cancelada
    ? 'No aplica'
    : resumen.pendiente > 0 && resumen.estaFacturada
      ? 'Facturado parcial'
      : resumen.estaFacturada
        ? 'Facturado'
        : 'Pendiente de facturar';

  return {
    fecha: reserva.fecha,
    reserva: reserva.id,
    cliente: reserva.cliente,
    sala: reserva.sala,
    monto: resumen.estaFacturada ? resumen.facturado : resumen.pendiente,
    comoFacturar: 'Web - Facturante',
    estado,
  };
});

const armarDatosReporte = (reporte, reservations, payments) => {
  const reservasPeriodo = filtrarPorRango(reservations, reporte.desde, reporte.hasta);
  const pagosPeriodo = filtrarPorRango(payments, reporte.desde, reporte.hasta);
  return {
    reservas: reservasPeriodo.map((reserva) => ({
      ID: reserva.id,
      Cliente: reserva.cliente,
      Sala: reserva.sala,
      Fecha: reserva.fecha,
      Hora: reserva.hora,
      Personas: reserva.personas,
      Estado: reserva.estado,
      Pago: reserva.pago,
      Canal: reserva.canal,
    })),
    pagos: pagosPeriodo.map((pago) => ({
      ID: pago.id,
      Reserva: pago.reservaId || '',
      Cliente: pago.cliente,
      Detalle: pago.descripcion || pago.concepto || pago.sala || '',
      Monto: Number(pago.monto || 0),
      Tipo: pago.tipo,
      Metodo: pago.metodo,
      Estado: pago.estado,
      Fecha: pago.fecha,
    })),
    facturacion: filasFacturacion(reservasPeriodo, payments).map((fila) => ({
      Fecha: fila.fecha,
      Reserva: fila.reserva,
      Cliente: fila.cliente,
      Sala: fila.sala,
      Monto: Number(fila.monto || 0),
      'Como facturar': fila.comoFacturar,
      Estado: fila.estado,
    })),
  };
};

const tablaHtml = (titulo, filas) => {
  const columnas = Object.keys(filas[0] || {});
  return `
    <section class="sheet">
      <h2>${escapeHtml(titulo)}</h2>
      ${filas.length === 0 ? '<p class="empty">Sin registros para este periodo.</p>' : `
        <table>
          <thead><tr>${columnas.map((col) => `<th>${escapeHtml(col)}</th>`).join('')}</tr></thead>
          <tbody>
            ${filas.map((fila) => `
              <tr>${columnas.map((col) => `<td>${escapeHtml(col === 'Monto' ? moneda(fila[col]) : fila[col])}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </section>
  `;
};

const exportarPdf = (reporte, reservations, payments) => {
  const datos = armarDatosReporte(reporte, reservations, payments);
  const ventana = window.open('', '_blank');
  if (!ventana) return false;

  ventana.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(reporte.archivo)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          .periodo { color: #64748b; margin-bottom: 24px; }
          .sheet { page-break-after: always; }
          .sheet:last-child { page-break-after: auto; }
          h2 { font-size: 18px; margin: 0 0 14px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #f1f5f9; color: #475569; text-align: left; }
          th, td { border: 1px solid #dbe3ef; padding: 6px; vertical-align: top; }
          .empty { color: #64748b; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(reporte.titulo)}</h1>
        <p class="periodo">Periodo: ${formatFecha(reporte.desde)} al ${formatFecha(reporte.hasta)}</p>
        ${tablaHtml('Listado de reservas', datos.reservas)}
        ${tablaHtml('Listado de pagos', datos.pagos)}
        ${tablaHtml('Listado de facturacion', datos.facturacion)}
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  ventana.document.close();
  return true;
};

const worksheetXml = (nombre, filas) => {
  const columnas = Object.keys(filas[0] || { Mensaje: 'Sin registros para este periodo.' });
  const filasNormalizadas = filas.length ? filas : [{ Mensaje: 'Sin registros para este periodo.' }];

  return `
    <Worksheet ss:Name="${escapeHtml(nombre)}">
      <Table>
        <Row>${columnas.map((col) => `<Cell><Data ss:Type="String">${escapeHtml(col)}</Data></Cell>`).join('')}</Row>
        ${filasNormalizadas.map((fila) => `
          <Row>
            ${columnas.map((col) => {
              const valor = fila[col] ?? '';
              const esNumero = typeof valor === 'number';
              return `<Cell><Data ss:Type="${esNumero ? 'Number' : 'String'}">${escapeHtml(valor)}</Data></Cell>`;
            }).join('')}
          </Row>
        `).join('')}
      </Table>
    </Worksheet>
  `;
};

const exportarExcel = (reporte, reservations, payments) => {
  const datos = armarDatosReporte(reporte, reservations, payments);
  const contenido = `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      ${worksheetXml('Reservas', datos.reservas)}
      ${worksheetXml('Pagos', datos.pagos)}
      ${worksheetXml('Facturacion', datos.facturacion)}
    </Workbook>`;

  descargarArchivo(
    contenido,
    `${reporte.archivo}.xls`,
    'application/vnd.ms-excel;charset=utf-8'
  );
};

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
    if (formato === 'PDF') {
      const pudoAbrir = exportarPdf(reporte, reservations, payments);
      if (!pudoAbrir) {
        triggerToast?.('El navegador bloqueo la ventana de impresion del PDF');
        return;
      }
    } else {
      exportarExcel(reporte, reservations, payments);
    }

    setExportacionCorrecta({ archivo: reporte.archivo, formato });
    triggerToast?.(`Exportacion ${formato} generada para ${reporte.archivo}`);
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
