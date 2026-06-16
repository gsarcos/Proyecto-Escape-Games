const PRECIOS_REGULARES = {
  2: 60000,
  3: 84000,
  4: 104000,
  5: 120000,
  6: 132000,
  7: 140000,
};

const SALAS_25_OFF = new Set(['Catalepsia', 'Sherlock Holmes', 'Psicosis']);
const SALAS_40_OFF = new Set(['El Carnicero de Almagro']);

export const obtenerDescuentoReserva = (reserva = {}) => {
  if (SALAS_40_OFF.has(reserva.sala)) return 40;
  if (SALAS_25_OFF.has(reserva.sala)) return 25;
  return 0;
};

const totalConDescuento = (personas, descuento) => {
  const totalRegular = PRECIOS_REGULARES[personas] || (personas > 7 ? personas * 20000 : 0);
  return totalRegular ? Math.round(totalRegular * (1 - descuento)) : 0;
};

export const calcularPrecioReserva = (reserva = {}) => {
  const personas = Number(reserva.personas);
  const sala = reserva.sala;

  if (SALAS_40_OFF.has(sala)) return totalConDescuento(personas, 0.4);
  if (SALAS_25_OFF.has(sala)) return totalConDescuento(personas, 0.25);

  if (PRECIOS_REGULARES[personas]) return PRECIOS_REGULARES[personas];
  if (personas > 7) return personas * 20000;

  return Number(reserva.montoTotal || 0);
};

export const pagosDeReserva = (payments = [], reservaId) => (
  payments.filter((pago) => pago.reservaId && pago.reservaId === reservaId && pago.estado === 'Pagado')
);

const esPagoSenia = (pago = {}) => {
  const texto = `${pago.concepto || ''} ${pago.descripcion || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return texto.includes('sena');
};

export const calcularResumenPagoReserva = (reserva = {}, payments = []) => {
  const movimientos = pagosDeReserva(payments, reserva.id);
  const totalReserva = calcularPrecioReserva(reserva);
  const descuentoPorcentaje = obtenerDescuentoReserva(reserva);
  const totalPagadoBruto = movimientos
    .filter((pago) => pago.tipo === 'Ingreso')
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
  const seniaPagadaBruta = movimientos
    .filter((pago) => pago.tipo === 'Ingreso' && esPagoSenia(pago))
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
  const seniaDeclarada = Number(reserva.montoSena || 0);
  const totalPagado = totalReserva > 0 ? Math.min(totalPagadoBruto, totalReserva) : totalPagadoBruto;
  const seniaBase = seniaPagadaBruta > 0 ? seniaPagadaBruta : seniaDeclarada;
  const seniaPagada = totalReserva > 0 ? Math.min(seniaBase, totalReserva) : seniaBase;
  const saldo = Math.max(0, totalReserva - totalPagado);

  return {
    totalReserva,
    descuentoPorcentaje,
    totalPagado,
    seniaPagada,
    saldo,
    estaSaldada: totalReserva > 0 && saldo === 0,
  };
};
