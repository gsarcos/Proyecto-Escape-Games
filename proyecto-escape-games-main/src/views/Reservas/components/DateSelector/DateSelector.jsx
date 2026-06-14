// src/views/Reservas/components/DateSelector/DateSelector.jsx
import React, { useContext } from 'react';
import { AppContext } from '../../../../context/AppContext';
import './DateSelector.css';

const MESES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'
];

const DIAS_SEMANA = [
  'Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'
];

function isoHoy() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

function isoADate(iso) {
  // Parseo seguro sin timezone shift
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatLabel(iso) {
  if (!iso) return '';
  const date = isoADate(iso);
  return `${DIAS_SEMANA[date.getDay()]} ${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

function moverDia(iso, delta) {
  const base = isoADate(iso);
  base.setDate(base.getDate() + delta);
  return `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(base.getDate()).padStart(2,'0')}`;
}

export default function DateSelector() {
  const { fechaAuditoria, setFechaAuditoria } = useContext(AppContext);

  const fecha  = fechaAuditoria || isoHoy();
  const esHoy  = fecha === isoHoy();

  return (
    <div className="ds-wrapper">
      {/* Botón día anterior */}
      <button
        className="ds-nav"
        onClick={() => setFechaAuditoria(moverDia(fecha, -1))}
        title="Día anterior"
      >
        &#8249;
      </button>

      {/* Label clickeable que abre el date picker nativo */}
      <label className="ds-label-wrapper" title="Seleccioná una fecha">
        <span className="ds-label">{formatLabel(fecha)}</span>
        <input
          type="date"
          className="ds-hidden-input"
          value={fecha}
          onChange={(e) => e.target.value && setFechaAuditoria(e.target.value)}
        />
      </label>

      {/* Botón día siguiente */}
      <button
        className="ds-nav"
        onClick={() => setFechaAuditoria(moverDia(fecha, 1))}
        title="Día siguiente"
      >
        &#8250;
      </button>

      {/* Botón Hoy — solo si no es hoy */}
      {!esHoy && (
        <button
          className="ds-hoy"
          onClick={() => setFechaAuditoria(isoHoy())}
        >
          Hoy
        </button>
      )}
    </div>
  );
}