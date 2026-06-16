import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import MetricCard from '../../components/MetricCard/MetricCard';
import Calendario from './components/Calendario/Calendario';
import './Inicio.css';
import InfraStatus from './components/InfraStatus/InfraStatus';

export default function Inicio() {
  const { reservations } = useContext(AppContext);
  const [fechaCalendario, setFechaCalendario] = useState(new Date());

  const fechaAuditoria = '2026-06-08';
  const setFechaAuditoria = () => {};
  const hoyObjeto = new Date();

  const anioSeleccionado = fechaCalendario.getFullYear();
  const mesSeleccionado = fechaCalendario.getMonth() + 1;
  const mesFormateado = String(mesSeleccionado).padStart(2, '0');
  const stringHoy = `${hoyObjeto.getFullYear()}-${String(hoyObjeto.getMonth() + 1).padStart(2, '0')}-${String(hoyObjeto.getDate()).padStart(2, '0')}`;
  const ultimoDiaMes = new Date(anioSeleccionado, mesSeleccionado, 0).getDate();
  const inicioMes = `${anioSeleccionado}-${mesFormateado}-01`;
  const finMes = `${anioSeleccionado}-${mesFormateado}-${String(ultimoDiaMes).padStart(2, '0')}`;

  const reservasActivasDelMes = reservations.filter((res) => {
    if (!res.fecha) return false;
    return res.fecha >= inicioMes && res.fecha <= finMes && res.estado !== 'Cancelada';
  });

  const turnosFuturosDelMes = reservasActivasDelMes.filter((res) => res.fecha >= stringHoy);
  const totalTurnosMes = reservasActivasDelMes.length;
  const confirmadosPagadosMes = reservasActivasDelMes.filter((res) => res.pago === 'Pagado').length;
  const turnosFuturosMes = turnosFuturosDelMes.length;
  const pendientesMes = reservasActivasDelMes.filter((res) => res.pago !== 'Pagado').length;

  return (
    <div className="inicio-container">
      <div className="inicio-header">
        <h1>Control de Operaciones</h1>
        <p className="fecha-sistema">
          Prevision: {fechaCalendario.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="operaciones-grid">
        <MetricCard
          label="TOTAL DE TURNOS (MES)"
          value={totalTurnosMes}
          variant="yellow"
        />
        <MetricCard
          label="CONFIRMADOS / PAGADOS (MES)"
          value={confirmadosPagadosMes}
          variant="green"
        />
        <MetricCard
          label="TURNOS FUTUROS (MES)"
          value={turnosFuturosMes}
          variant="blue"
        />
        <MetricCard
          label="POR COBRAR / PENDIENTES (MES)"
          value={pendientesMes}
          variant="orange"
        />
      </div>

      <div className="calendar-section">
        <Calendario
          reservations={reservations}
          fechaAuditoria={fechaAuditoria}
          setFechaAuditoria={setFechaAuditoria}
          onFechaBaseChange={setFechaCalendario}
        />
      </div>

      <div className="infra-section-wrapper">
        <InfraStatus />
      </div>
    </div>
  );
}
