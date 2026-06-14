const MONTO_TOTAL_DEFAULT = 12000;
const RESERVAS_DEMO_PENDIENTES = new Set([
  'JUN-1206',
  'JUN-1207',
  'JUN-1208',
  'JUN-1209',
  'JUN-1210',
]);

export const montoTotalReserva = (reserva) => Number(reserva?.montoTotal) || MONTO_TOTAL_DEFAULT;

export const estaCancelada = (reserva) => reserva?.estado?.toLowerCase() === 'cancelada';

export const movimientosDeReserva = (payments = [], reservaId) => (
  payments.filter((pago) => pago.reservaId && pago.reservaId === reservaId && pago.estado === 'Pagado')
);

const esIngresoFacturado = (pago) => (
  pago.tipo === 'Ingreso'
    && (pago.facturacionEstado ? pago.facturacionEstado === 'Facturado' : true)
);

export const resumenFacturacionReserva = (reserva, payments = []) => {
  const movimientos = movimientosDeReserva(payments, reserva?.id);
  const ingresos = movimientos
    .filter((pago) => pago.tipo === 'Ingreso')
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
  const ingresosFacturados = movimientos
    .filter(esIngresoFacturado)
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
  const egresos = movimientos
    .filter((pago) => pago.tipo === 'Egreso')
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
  const netoMovimientos = Math.max(0, ingresosFacturados - egresos);
  const total = montoTotalReserva(reserva);
  const facturadoManual = reserva?.facturado === true;
  const tieneFacturacionExplicita = movimientos.some((pago) => pago.facturacionEstado);
  const demoPendiente = RESERVAS_DEMO_PENDIENTES.has(reserva?.id) && !facturadoManual && !tieneFacturacionExplicita;
  const fallbackFacturado = !demoPendiente && !tieneFacturacionExplicita && reserva?.pago?.toLowerCase() === 'pagado' ? total : 0;
  const facturadoBase = facturadoManual ? total : demoPendiente ? 0 : netoMovimientos > 0 ? netoMovimientos : fallbackFacturado;
  const facturado = Math.min(total, facturadoBase);
  const pendiente = Math.max(0, total - facturado);

  return {
    movimientos,
    ingresos,
    egresos,
    total,
    facturado,
    pendiente,
    tieneMovimientos: movimientos.length > 0,
    estaFacturada: facturado > 0 || reserva?.facturado === true,
  };
};
