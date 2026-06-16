import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faChartColumn,
  faChartPie,
  faCreditCard,
  faFileLines,
  faPlug,
  faReceipt,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

export default function Sidebar() {
  const { currentView, setCurrentView, currentUser, logout } = useContext(AppContext);

  if (!currentUser) return null;

  const inicial = currentUser.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U';
  
  // Forzamos mayúsculas para que matchee con los roles normalizados
  const rol = currentUser.rol?.toUpperCase() || 'RECEPCIONISTA';

  // Definición exacta de permisos para los botones
  const esAdminOGerente = rol === 'ADMIN' || rol === 'MANAGMENT' || rol === 'ANALISTA';
  const esAnalistaExclusivo = rol === 'ANALISTA';

  return (
    <aside className="sidebar-container">
      <div className="sidebar-header">
        <h3 className="sidebar-brand">Escape Room</h3>
      </div>

      <nav className="sidebar-nav">
        {/* VISTAS COMUNES (Todos los roles ingresan) */}
        <button
          onClick={() => setCurrentView('INICIO')}
          className={`sidebar-link ${currentView === 'INICIO' ? 'active' : ''}`}
        >
          <FontAwesomeIcon className="sidebar-link-icon" icon={faChartColumn} />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => setCurrentView('RESERVAS')}
          className={`sidebar-link ${currentView === 'RESERVAS' ? 'active' : ''}`}
        >
          <FontAwesomeIcon className="sidebar-link-icon" icon={faCalendarDays} />
          <span>Reservas</span>
        </button>

        <button
          onClick={() => setCurrentView('PAGOS')}
          className={`sidebar-link ${currentView === 'PAGOS' ? 'active' : ''}`}
        >
          <FontAwesomeIcon className="sidebar-link-icon" icon={faCreditCard} />
          <span>Pagos</span>
        </button>

        <button
          onClick={() => setCurrentView('FACTURACION')}
          className={`sidebar-link ${currentView === 'FACTURACION' ? 'active' : ''}`}
        >
          <FontAwesomeIcon className="sidebar-link-icon" icon={faReceipt} />
          <span>Facturacion</span>
        </button>

        {/* VISTAS PARA GERENTES/SOCIOS (ADMIN) Y ANALISTAS */}
        {esAdminOGerente && (
          <>
            <button
              onClick={() => setCurrentView('REPORTES')}
              className={`sidebar-link ${currentView === 'REPORTES' ? 'active' : ''}`}
            >
              <FontAwesomeIcon className="sidebar-link-icon" icon={faFileLines} />
              <span>Reportes</span>
            </button>

            <button
              onClick={() => setCurrentView('ESTADISTICAS')}
              className={`sidebar-link ${currentView === 'ESTADISTICAS' ? 'active' : ''}`}
            >
              <FontAwesomeIcon className="sidebar-link-icon" icon={faChartPie} />
              <span>Estadisticas</span>
            </button>
          </>
        )}

        {/* VISTAS EXCLUSIVAS DEL ANALISTA */}
        {esAnalistaExclusivo && (
          <>
            <button
              onClick={() => setCurrentView('INTEGRACION')}
              className={`sidebar-link ${currentView === 'INTEGRACION' ? 'active' : ''}`}
            >
              <FontAwesomeIcon className="sidebar-link-icon" icon={faPlug} />
              <span>Integracion</span>
            </button>

            <button
              onClick={() => setCurrentView('USUARIOS')}
              className={`sidebar-link ${currentView === 'USUARIOS' ? 'active' : ''}`}
            >
              <FontAwesomeIcon className="sidebar-link-icon" icon={faUsers} />
              <span>Usuarios</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-profile-card">
          <div className="sidebar-avatar">
            {inicial}
          </div>
          <div className="sidebar-profile-info">
            <p className="sidebar-profile-name">{currentUser.nombre}</p>
            <p className="sidebar-profile-email">{currentUser.email}</p>
            <span className="sidebar-profile-role" style={{ fontSize: '11px', color: '#f97316', fontWeight: 'bold' }}>
              {rol}
            </span>
          </div>
        </div>

        <button onClick={logout} className="sidebar-logout-btn">
          Cerrar Sesion
        </button>
      </div>
    </aside>
  );
}