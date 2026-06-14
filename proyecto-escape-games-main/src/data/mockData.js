// src/data/mockData.js
import { importedReservations } from './importedReservations';
import { importedPayments } from './importedPayments';
import { escapeRooms } from './rooms';

export { escapeRooms };
// 1. USUARIOS INICIALES (Para el Login y la nueva pantalla de Usuarios)
export const initialUsers = [
  {
    id: 1,
    nombre: "Recepcion Local",
    email: "admin@escaperoom.com",
    password: "admin",
    rol: "ADMINISTRADOR"
  },
  {
    id: 2,
    nombre: "Analista Tecnico",
    email: "analista@escaperoom.com",
    password: "admin",
    rol: "ANALISTA"
  }
];

// 2. LISTADO DE SALAS (Para los selectores de los formularios de agregar/editar)
// 3. RESERVAS INICIALES (Extraidas textualmente de tus capturas del PDF)
export const initialReservations = importedReservations;

export const initialPayments = importedPayments;

// 5. METRICAS FINANCIERAS INICIALES (Para las KPI Cards globales del Analista)
export const initialFinancialMetrics = {
  totalRecaudadoHoy: 11500,
  movimientoCajaChica: 7500,
  totalMensual: 30000
};

// 6. CONTROL DE INFRAESTRUCTURA (Para la auditoria del Analista de Aplicaciones)
export const initialSystemStatus = {
  bookneticApi: "ONLINE", // ONLINE, OFFLINE
  autoPayGateway: "ONLINE",
  lastSync: "Hace 5 minutos"
};



