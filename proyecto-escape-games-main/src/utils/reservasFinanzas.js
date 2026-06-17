// src/utils/reservasFinanzas.js

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

const totalConDescuento = (personas, descuentoPorcentaje) => {
  // Buscamos en la lista oficial. Si son más de 7, calculamos la base regular de 20.000 por persona.
  const totalRegular = PRECIOS_REGULARES[personas] || (personas >= 2 ? personas * 20000 : 0);
  return totalRegular ? Math.round(totalRegular * (1 - (descuentoPorcentaje / 100))) : 0;
};

export const calcularPrecioReserva = (reserva = {}) => {
  const personas = Number(reserva.personas || reserva.cantidadPersonas || 0);
  const sala = reserva.sala;

  // 1. PRIORIDAD ALTA: Si la sala tiene descuento configurado, calculamos dinámicamente sobre la lista base
  if (SALAS_40_OFF.has(sala)) return totalConDescuento(personas, 40);
  if (SALAS_25_OFF.has(sala)) return totalConDescuento(personas, 25);

  // 2. Si la sala NO tiene descuento, pero el objeto trae un montoTotal explícito de la base de datos/mock, lo respetamos
  if (reserva.montoTotal !== undefined && reserva.montoTotal !== null) {
    return Number(reserva.montoTotal);
  }
  if (reserva.precioTotal !== undefined && reserva.precioTotal !== null) {
    return Number(reserva.precioTotal);
  }

  // 3. Fallback en caso de que no traiga montos fijos ni descuentos (Cálculo estándar de lista)
  if (PRECIOS_REGULARES[personas]) return PRECIOS_REGULARES[personas];
  if (personas > 0) return personas * 20000;

  return 0;
};

export const pagosDeReserva = (payments = [], reservaId) => (
  payments.filter((pago) => pago.reservaId && pago.reservaId === reservaId)
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
  
  // 1. Conseguimos lo que se declaró como seña en el objeto mock de la reserva
  const seniaDeclarada = Number(reserva.montoSena || reserva.senaPagada || 0);

  // 2. Sumamos todos los ingresos extras que se cargaron en el sistema para esta reserva
  // (Filtramos que no sea la seña duplicada si es que la registrás en ambos lados)
  const pagosExtrasBrutos = movimientos
    .filter((pago) => pago.tipo === 'Ingreso' && !esPagoSenia(pago))
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
    
  // Si en payments guardás TODO (incluida la seña), usás totalPagadoBruto. 
  // Si en payments solo cargás lo nuevo presencial/caja, sumamos la señaDeclarada + extras.
  const seniaPagadaBruta = movimientos
    .filter((pago) => pago.tipo === 'Ingreso' && esPagoSenia(pago))
    .reduce((acc, pago) => acc + Number(pago.monto || 0), 0);

  const seniaPagada = totalReserva > 0 
    ? Math.min(seniaPagadaBruta > 0 ? seniaPagadaBruta : seniaDeclarada, totalReserva) 
    : (seniaPagadaBruta > 0 ? seniaPagadaBruta : seniaDeclarada);

  // El total pagado real es la Seña + los Pagos Extras cargados en caja
  const totalPagadoEfectivo = seniaPagada + pagosExtrasBrutos;
  const totalPagado = totalReserva > 0 ? Math.min(totalPagadoEfectivo, totalReserva) : totalPagadoEfectivo;
  
  // CORRECCIÓN MATEMÁTICA: El saldo real es el total de la reserva menos todo lo que ingresó
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
