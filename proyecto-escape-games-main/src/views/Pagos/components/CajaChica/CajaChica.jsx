import { useState } from 'react';
import './CajaChica.css';

export default function CajaChica({ payments }) {
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  const filtrados = payments.filter((p) => (
    filtroTipo === 'Todos' ? true : p.tipo === filtroTipo
  ));

  const totalIngresos = payments
    .filter((p) => p.tipo === 'Ingreso')
    .reduce((acc, p) => acc + Number(p.monto || 0), 0);

  const totalEgresos = payments
    .filter((p) => p.tipo === 'Egreso')
    .reduce((acc, p) => acc + Number(p.monto || 0), 0);

  return (
    <div className="caja-container">
      <div className="caja-header">
        <div className="caja-resumen">
          <div className="caja-resumen-item">
            <span className="caja-resumen-label">Ingresos</span>
            <span className="caja-resumen-value caja-resumen-value--pos">
              + $ {totalIngresos.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="caja-divider" />
          <div className="caja-resumen-item">
            <span className="caja-resumen-label">Egresos</span>
            <span className="caja-resumen-value caja-resumen-value--neg">
              - $ {totalEgresos.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="caja-divider" />
          <div className="caja-resumen-item">
            <span className="caja-resumen-label">Saldo</span>
            <span className={`caja-resumen-value ${totalIngresos - totalEgresos >= 0 ? 'caja-resumen-value--pos' : 'caja-resumen-value--neg'}`}>
              $ {(totalIngresos - totalEgresos).toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        <div className="caja-filtros">
          {['Todos', 'Ingreso', 'Egreso'].map((tipo) => (
            <button
              key={tipo}
              className={`caja-filtro-btn ${filtroTipo === tipo ? 'caja-filtro-btn--active' : ''}`}
              onClick={() => setFiltroTipo(tipo)}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      <div className="caja-lista">
        {filtrados.length === 0 ? (
          <div className="caja-empty">No hay movimientos para mostrar</div>
        ) : (
          filtrados.map((pago) => (
            <div key={pago.id} className="caja-item">
              <div className="caja-item-icono">
                {pago.tipo === 'Ingreso' ? '+' : '-'}
              </div>
              <div className="caja-item-info">
                <span className="caja-item-cliente">{pago.cliente}</span>
                <span className="caja-item-meta">
                  {pago.metodo} - {pago.fecha} - {pago.reservaId || pago.descripcion || pago.concepto}
                </span>
              </div>
              <div className="caja-item-right">
                <span className={`caja-item-monto ${pago.tipo === 'Ingreso' ? 'caja-monto--pos' : 'caja-monto--neg'}`}>
                  {pago.tipo === 'Ingreso' ? '+' : '-'} $ {Number(pago.monto || 0).toLocaleString('es-AR')}
                </span>
                <span className={`caja-item-estado caja-estado--${pago.estado.toLowerCase()}`}>
                  {pago.estado}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
