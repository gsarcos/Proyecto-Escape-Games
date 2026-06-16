import React, { useContext } from 'react';
import { AppContext } from './context/AppContext';

// Importación de Componentes y Vistas
import Login from './views/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import Inicio from './views/Inicio/Inicio';
import Reservas from './views/Reservas/Reservas';
import Facturacion from './views/Facturacion/Facturacion';
import Pagos from './views/Pagos/Pagos';
import Usuarios from './views/Usuarios/Usuarios';
import Estadisticas from './views/Estadisticas/Estadisticas';
import Reportes from './views/Reportes/Reportes';
import Integraciones from './views/Integraciones/Integraciones';
import './App.css';

export default function App() {
  const { currentUser, currentView } = useContext(AppContext);

  // Forzamos mayúsculas para que coincida siempre sin importar cómo venga de la base de datos
  const rol = currentUser?.rol?.toUpperCase() || 'RECEPCIONISTA';
  
  // Validaciones de acceso simples
  const esAdminOGerente = rol === 'ADMIN' || rol === 'MANAGMENT' || rol === 'ANALISTA';
  const esAnalistaExclusivo = rol === 'ANALISTA';

  // Selector dinámico de pantallas según rol
  const renderActiveView = () => {
    switch (currentView) {
      case 'INICIO':
        return <Inicio />;
      case 'RESERVAS':
        return <Reservas />;
      case 'PAGOS':
        return <Pagos />;
      case 'FACTURACION':
        return <Facturacion />;
      
      // Vistas para Socios/Gerentes y Analistas
      case 'ESTADISTICAS':
        return esAdminOGerente ? <Estadisticas /> : <Inicio />;
      case 'REPORTES':
        return esAdminOGerente ? <Reportes /> : <Inicio />;
      
      // Vistas exclusivas del Analista de Sistemas
      case 'INTEGRACION':
        return esAnalistaExclusivo ? <Integraciones /> : <Inicio />;
      case 'USUARIOS':
        return esAnalistaExclusivo ? <Usuarios /> : <Inicio />;
      
      default:
        return <Inicio />;
    }
  };

  return (
    <div className="app-container">
      {!currentUser ? (
        <Login />
      ) : (
        <>
          <Sidebar />
          <main className="main-content" style={{ padding: '40px', backgroundColor: '#f8fafc' }}>
            {renderActiveView()}
          </main>
        </>
      )}
    </div>
  );
}