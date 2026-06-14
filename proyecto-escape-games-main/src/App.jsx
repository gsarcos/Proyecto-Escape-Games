// src/App.jsx
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

import './App.css';
import Integraciones from './views/Integraciones/Integraciones';

export default function App() {
  const { currentUser, currentView } = useContext(AppContext);
  const puedeVerModulosAdmin = currentUser && currentUser.rol !== 'ANALISTA';

  // Selector dinámico de pantallas
  const renderActiveView = () => {
    switch (currentView) {
      case 'INICIO':
        return <Inicio />;
      case 'RESERVAS':
        return <Reservas />;
      case 'ESTADISTICAS':
        return puedeVerModulosAdmin ? <Estadisticas /> : <Inicio />;
      case 'REPORTES':
        return puedeVerModulosAdmin ? <Reportes /> : <Inicio />;
      case 'PAGOS':
        return <Pagos />;
      case 'FACTURACION':
        return <Facturacion />;
      case 'INTEGRACION':
        return <Integraciones />;
      case 'USUARIOS':
        return <Usuarios />;
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
          <main className="main-content" style={{ padding: '40px', backgroundColor: '#ffffff' }}>
            {renderActiveView()}
          </main>
        </>
      )}
    </div>
  );
}
