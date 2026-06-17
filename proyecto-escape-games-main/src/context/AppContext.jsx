// src/context/AppContext.jsx
import { createContext, useEffect, useState } from 'react';
import {
  initialUsers,
  initialReservations,
  initialPayments,
  initialFinancialMetrics,
  initialSystemStatus
} from '../data/mockData';
import { normalizeRoomHour, normalizeRoomName } from '../data/rooms';
import { calcularResumenPagoReserva } from '../utils/reservasFinanzas';

export const AppContext = createContext();

const FACTURACION_STATE_VERSION = 'facturacion-hasta-2026-06-15-v1';
const RESERVAS_DATASET_VERSION = 'reservas-reales-enero-junio-v4';
const PAYMENTS_DATASET_VERSION = 'pagos-planilla-ingresos-egresos-v3';
const FECHA_CIERRE_FACTURACION = '2026-06-15';

const normalizarUsuario = (usuario) => {
  if (!usuario?.email) return usuario;
  
  const emailLower = usuario.email.toLowerCase();

  if (emailLower === 'analista@escaperoom.com') {
    return { ...usuario, nombre: 'Analista Técnico', rol: 'ANALISTA' };
  }
  if (emailLower === 'recepcion@escaperoom.com') {
    return { ...usuario, nombre: 'Recepcionista Demo', rol: 'RECEPCIONISTA' };
  }
  if (emailLower === 'socio@escaperoom.com' || emailLower === 'admin@escaperoom.com') {
    return { ...usuario, nombre: 'Socio Demo', rol: 'ADMIN' };
  }

  return usuario;
};

const normalizarUsuarios = (usuarios = []) => usuarios.map(normalizarUsuario);

const fusionarPorId = (base = [], nuevas = []) => {
  const porId = new Map();
  base.forEach((item) => {
    if (item?.id) porId.set(item.id, item);
  });
  nuevas.forEach((item) => {
    if (item?.id && !porId.has(item.id)) porId.set(item.id, item);
  });
  return Array.from(porId.values());
};

const normalizarReservas = (reservas = []) => {
  const porId = new Map();

  reservas.forEach((reserva, index) => {
    const id = reserva?.id || `REV-SIN-ID-${index + 1}`;
    const sala = normalizeRoomName(reserva?.sala);
    const hora = normalizeRoomHour(sala, reserva?.hora);
    porId.set(id, { ...reserva, id, sala, hora });
  });

  return Array.from(porId.values());
};

const limpiarEstadoFacturacion = (reservas = []) => reservas.map((reserva) => {
  const { facturado, fechaFacturacion, ...datosReserva } = reserva;
  return datosReserva;
});

const aplicarCierreFacturacion = (reservas = []) => reservas.map((reserva) => {
  if (!reserva?.fecha) return reserva;

  if (reserva.fecha <= FECHA_CIERRE_FACTURACION) {
    return {
      ...reserva,
      facturado: true,
      fechaFacturacion: reserva.fechaFacturacion || FECHA_CIERRE_FACTURACION,
    };
  }

  const { facturado, fechaFacturacion, ...datosReserva } = reserva;
  return datosReserva;
});

const cargarReservasPersistidas = () => {
  const saved = localStorage.getItem('er_reservations');
  const datasetVersion = localStorage.getItem('er_reservations_dataset_version');

  if (datasetVersion !== RESERVAS_DATASET_VERSION) {
    localStorage.setItem('er_reservations_dataset_version', RESERVAS_DATASET_VERSION);
    const guardadas = saved ? JSON.parse(saved) : [];
    return aplicarCierreFacturacion(normalizarReservas(fusionarPorId(guardadas, initialReservations)));
  }

  const reservasBase = normalizarReservas(saved ? JSON.parse(saved) : initialReservations);
  const versionFacturacion = localStorage.getItem('er_facturacion_state_version');

  if (saved && versionFacturacion !== FACTURACION_STATE_VERSION) {
    localStorage.setItem('er_facturacion_state_version', FACTURACION_STATE_VERSION);
    return aplicarCierreFacturacion(limpiarEstadoFacturacion(reservasBase));
  }

  return aplicarCierreFacturacion(reservasBase);
};

const cargarPagosPersistidos = () => {
  const saved = localStorage.getItem('er_payments');
  const datasetVersion = localStorage.getItem('er_payments_dataset_version');

  if (datasetVersion !== PAYMENTS_DATASET_VERSION) {
    localStorage.setItem('er_payments_dataset_version', PAYMENTS_DATASET_VERSION);
    const guardados = saved ? JSON.parse(saved) : [];
    return fusionarPorId(guardados, initialPayments);
  }

  return saved ? JSON.parse(saved) : initialPayments;
};

const isoHoy = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('er_users');
    return normalizarUsuarios(saved ? JSON.parse(saved) : initialUsers);
  });

  const [reservations, setReservations] = useState(() => cargarReservasPersistidas());

  const [payments, setPayments] = useState(() => {
    return cargarPagosPersistidos();
  });

  const [metrics, setMetrics] = useState(() => {
    const saved = localStorage.getItem('er_metrics');
    return saved ? JSON.parse(saved) : initialFinancialMetrics;
  });

  const [systemStatus, setSystemStatus] = useState(() => {
    const saved = localStorage.getItem('er_system_status');
    return saved ? JSON.parse(saved) : initialSystemStatus;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('er_current_user');
    return saved ? normalizarUsuario(JSON.parse(saved)) : null;
  });

  const [currentView, setCurrentView] = useState('INICIO');
  const [toastMessage, setToastMessage] = useState('');
  const [fechaAuditoria, setFechaAuditoria] = useState(isoHoy());
  const [paymentDraft, setPaymentDraft] = useState(null);

  useEffect(() => { setReservations((prev) => aplicarCierreFacturacion(normalizarReservas(prev))); }, []);
  useEffect(() => { setUsers((prev) => normalizarUsuarios(prev)); }, []);
  useEffect(() => {
    setReservations((prev) => {
      let huboCambios = false;
      const actualizadas = prev.map((reserva) => {
        if (reserva.estado === 'Cancelada') return reserva;
        const resumen = calcularResumenPagoReserva(reserva, payments);
        if (!resumen.estaSaldada || (reserva.estado === 'Completada' && reserva.pago === 'Pagado')) {
          return reserva;
        }
        huboCambios = true;
        return { ...reserva, estado: 'Completada', pago: 'Pagado' };
      });

      return huboCambios ? actualizadas : prev;
    });
  }, [payments]);
  useEffect(() => { localStorage.setItem('er_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('er_reservations', JSON.stringify(reservations)); }, [reservations]);
  useEffect(() => { localStorage.setItem('er_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('er_metrics', JSON.stringify(metrics)); }, [metrics]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('er_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('er_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }, [currentView]);

  const triggerToast = (msg) => setToastMessage(msg);

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('INICIO');
  };

  return (
    <AppContext.Provider value={{
      users, setUsers,
      reservations, setReservations,
      payments, setPayments,
      metrics, setMetrics,
      systemStatus, setSystemStatus,
      currentUser, setCurrentUser,
      currentView, setCurrentView,
      toastMessage, setToastMessage,
      triggerToast,
      logout,
      fechaAuditoria, setFechaAuditoria,
      paymentDraft, setPaymentDraft,
    }}>
      {children}
    </AppContext.Provider>
  );
};
