import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import './Estadisticas.css';

const MONTO_TOTAL_DEFAULT = 12000;
const CAPACIDAD_SALA_ESTIMADA = 6;
const chartColors = ['#f97316', '#fb923c', '#94a3b8', '#475569', '#38bdf8', '#16a34a', '#a855f7', '#f43f5e'];
const periodos = [
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'anio', label: 'Ano' },
];
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const agruparPor = (items, keyFn, valueFn = () => 1) => items.reduce((acc, item) => {
  const key = keyFn(item) || 'Sin dato';
  acc[key] = (acc[key] || 0) + valueFn(item);
  return acc;
}, {});

const ordenarEntradas = (objeto) => Object.entries(objeto).sort((a, b) => b[1] - a[1]);

const crearDonut = (entradas) => {
  const total = entradas.reduce((acc, [, value]) => acc + value, 0);
  if (!total) return '#e2e8f0 0% 100%';

  let acumulado = 0;
  return entradas.map(([, value], index) => {
    const inicio = acumulado;
    const fin = acumulado + (value / total) * 100;
    acumulado = fin;
    return `${chartColors[index % chartColors.length]} ${inicio}% ${fin}%`;
  }).join(', ');
};

const crearFechaLocal = (fechaIso) => {
  const [anio, mes, dia] = String(fechaIso || '').split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
};

const inicioDeSemana = (fecha) => {
  const base = new Date(fecha);
  const dia = base.getDay() || 7;
  base.setDate(base.getDate() - dia + 1);
  base.setHours(0, 0, 0, 0);
  return base;
};

const finDeSemana = (fecha) => {
  const fin = new Date(inicioDeSemana(fecha));
  fin.setDate(fin.getDate() + 6);
  fin.setHours(23, 59, 59, 999);
  return fin;
};

const formatearFechaCorta = (fecha) => `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`;

const fechaIsoLocal = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const crearConfigPeriodo = (tipo, filtros) => {
  const anioActual = Number(filtros.anio);
  const mesActual = Number(filtros.mes) - 1;

  if (tipo === 'semana') {
    const fechaSemana = crearFechaLocal(filtros.fechaSemana) || new Date();
    const inicio = inicioDeSemana(fechaSemana);
    const fin = finDeSemana(fechaSemana);
    return {
      titulo: `Semana del ${formatearFechaCorta(inicio)} al ${formatearFechaCorta(fin)}`,
      incluye: (fecha) => fecha >= inicio && fecha <= fin,
    };
  }

  if (tipo === 'anio') {
    return {
      titulo: `Ano ${anioActual}`,
      incluye: (fecha) => fecha.getFullYear() === anioActual,
    };
  }

  return {
    titulo: `${meses[mesActual]} ${anioActual}`,
    incluye: (fecha) => fecha.getFullYear() === anioActual && fecha.getMonth() === mesActual,
  };
};

const calcularOcupacionReserva = (reserva) => {
  const personas = Number(reserva.personas) || 0;
  return Math.min(personas, CAPACIDAD_SALA_ESTIMADA) / CAPACIDAD_SALA_ESTIMADA;
};

export default function Estadisticas() {
  const { reservations } = useContext(AppContext);
  const [periodoActivo, setPeriodoActivo] = useState('mes');
  const hoy = useMemo(() => new Date(), []);
  const [fechaSemana, setFechaSemana] = useState(fechaIsoLocal(hoy));
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth() + 1);
  const [anioMesSeleccionado, setAnioMesSeleccionado] = useState(hoy.getFullYear());
  const [anioSeleccionado, setAnioSeleccionado] = useState(hoy.getFullYear());

  const configPeriodo = useMemo(() => crearConfigPeriodo(periodoActivo, {
    fechaSemana,
    mes: mesSeleccionado,
    anio: periodoActivo === 'anio' ? anioSeleccionado : anioMesSeleccionado,
  }), [periodoActivo, fechaSemana, mesSeleccionado, anioMesSeleccionado, anioSeleccionado]);

  const reservasActivas = useMemo(() => reservations.filter((res) => {
    if (res.estado === 'Cancelada') return false;
    const fecha = crearFechaLocal(res.fecha);
    return fecha ? configPeriodo.incluye(fecha) : false;
  }), [reservations, configPeriodo]);

  const totalReservasActivas = reservasActivas.length;
  const salasOrdenadas = ordenarEntradas(agruparPor(reservasActivas, (res) => res.sala));
  const canalesOrdenados = ordenarEntradas(agruparPor(reservasActivas, (res) => res.canal));
  const horariosOrdenados = Object.entries(agruparPor(reservasActivas, (res) => res.hora?.slice(0, 2) || 'Sin hora'))
    .sort(([horaA], [horaB]) => horaA.localeCompare(horaB));
  const recaudacionPorSala = ordenarEntradas(agruparPor(
    reservasActivas,
    (res) => res.sala,
    (res) => Number(res.montoTotal) || MONTO_TOTAL_DEFAULT
  ));

  const salaMasPopular = salasOrdenadas[0]?.[0] || 'Sin datos';
  const salaMasRecaudada = recaudacionPorSala[0]?.[0] || 'Sin datos';
  const horaPico = horariosOrdenados.reduce((max, item) => (item[1] > max[1] ? item : max), ['Sin datos', 0]);
  const ocupacionMedia = totalReservasActivas
    ? Math.round((reservasActivas.reduce((acc, res) => acc + calcularOcupacionReserva(res), 0) / totalReservasActivas) * 100)
    : 0;

  const salasChart = salasOrdenadas;
  const canalesChart = canalesOrdenados;
  const maxHorario = Math.max(...horariosOrdenados.map(([, value]) => value), 1);
  const totalUsoSalas = salasChart.reduce((acc, [, value]) => acc + value, 0);
  const totalCanales = canalesChart.reduce((acc, [, value]) => acc + value, 0);

  return (
    <div className="estadisticas-container">
      <header className="estadisticas-header">
        <div>
          <h1>Estadisticas de Salas</h1>
          <p>Lectura operativa basada en las reservas cargadas del sistema</p>
        </div>
        <div className="period-tabs" role="group" aria-label="Periodo de estadisticas">
          {periodos.map((periodo) => (
            <button
              type="button"
              key={periodo.id}
              className={periodoActivo === periodo.id ? 'active' : ''}
              onClick={() => setPeriodoActivo(periodo.id)}
            >
              {periodo.label}
            </button>
          ))}
        </div>
        <div className="period-picker">
          {periodoActivo === 'semana' && (
            <label>
              Semana
              <input
                type="date"
                value={fechaSemana}
                onChange={(event) => setFechaSemana(event.target.value)}
              />
            </label>
          )}

          {periodoActivo === 'mes' && (
            <>
              <label>
                Mes
                <select value={mesSeleccionado} onChange={(event) => setMesSeleccionado(Number(event.target.value))}>
                  {meses.map((mes, index) => (
                    <option key={mes} value={index + 1}>{mes}</option>
                  ))}
                </select>
              </label>
              <label>
                Ano
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={anioMesSeleccionado}
                  onChange={(event) => setAnioMesSeleccionado(Number(event.target.value))}
                />
              </label>
            </>
          )}

          {periodoActivo === 'anio' && (
            <label>
              Ano
              <input
                type="number"
                min="2020"
                max="2035"
                value={anioSeleccionado}
                onChange={(event) => setAnioSeleccionado(Number(event.target.value))}
              />
            </label>
          )}
        </div>
      </header>

      <section className="periodo-resumen">
        <strong>{configPeriodo.titulo}</strong>
        <span>{totalReservasActivas} reservas activas en el periodo</span>
      </section>

      <div className="analytics-summary-grid">
        <article className="analytics-highlight-card">
          <span>Sala mas solicitada</span>
          <strong>{salaMasPopular}</strong>
        </article>
        <article className="analytics-kpi-card">
          <span>Ocupacion media</span>
          <strong>{ocupacionMedia}%</strong>
          <small>Promedio de llenado por reserva, con tope de sala completa.</small>
        </article>
        <article className="analytics-kpi-card">
          <span>Horario pico</span>
          <strong>{horaPico[0] !== 'Sin datos' ? `${horaPico[0]}:00` : horaPico[0]}</strong>
        </article>
        <article className="analytics-kpi-card">
          <span>Mayor recaudacion</span>
          <strong>{salaMasRecaudada}</strong>
        </article>
      </div>

      <div className="analytics-grid">
        <article className="analytics-card">
          <div className="analytics-card-header">
            <h3>Uso de Salas</h3>
            <span>{totalUsoSalas} reservas</span>
          </div>
          <div className="donut-layout">
            <div
              className="donut-chart"
              style={{ background: `conic-gradient(${crearDonut(salasChart)})` }}
            >
              <div className="donut-center">
                <strong>{totalUsoSalas}</strong>
                <span>Total</span>
              </div>
            </div>
            <div className="chart-legend">
              {salasChart.map(([label, value], index) => (
                <div className="legend-row" key={label}>
                  <span className="legend-label">
                    <i style={{ backgroundColor: chartColors[index % chartColors.length] }}></i>
                    {label}
                  </span>
                  <strong>{totalUsoSalas ? Math.round((value / totalUsoSalas) * 100) : 0}%</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-header">
            <h3>Volumen por Canal</h3>
            <span>{totalCanales} reservas</span>
          </div>
          <div className="donut-layout">
            <div
              className="donut-chart"
              style={{ background: `conic-gradient(${crearDonut(canalesChart)})` }}
            >
              <div className="donut-center">
                <strong>{totalCanales}</strong>
                <span>Reservas</span>
              </div>
            </div>
            <div className="chart-legend">
              {canalesChart.map(([label, value], index) => (
                <div className="legend-row" key={label}>
                  <span className="legend-label">
                    <i style={{ backgroundColor: chartColors[index % chartColors.length] }}></i>
                    {label}
                  </span>
                  <strong>{totalCanales ? Math.round((value / totalCanales) * 100) : 0}%</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="analytics-card analytics-card--wide">
          <div className="analytics-card-header">
            <h3>Horarios pico</h3>
            <span>{horaPico[1]} reservas en el pico</span>
          </div>
          <div className="peak-hours-chart">
            {horariosOrdenados.length > 0 ? (
              horariosOrdenados.map(([hora, value]) => (
                <div className="peak-hour-row" key={hora}>
                  <span>{hora}:00</span>
                  <div className="peak-hour-track">
                    <div style={{ width: `${(value / maxHorario) * 100}%` }}></div>
                  </div>
                  <strong>{value}</strong>
                </div>
              ))
            ) : (
              <p className="empty-stats">No hay reservas para este periodo.</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
