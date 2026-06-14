import React, { useContext } from 'react';
import { AppContext } from '../../../../context/AppContext';
import './InfraStatus.css';

export default function InfraStatus() {
  const { systemStatus, setSystemStatus, reservations = [] } = useContext(AppContext);

  // Conmutador del estado del servidor core o de la API externa
  const toggleStatus = (key) => {
    setSystemStatus(prev => ({
      ...prev,
      [key]: prev[key] === 'ONLINE' ? 'OFFLINE' : 'ONLINE'
    }));
  };

  // Filtrado estricto por canales válidos del negocio: Web o WhatsApp
  const viaWeb = reservations.filter(res => res.canal === 'Web').length;
  const viaWhatsApp = reservations.filter(res => res.canal === 'WhatsApp').length;

  return (
    <div className="infra-status-container">
      <h2 className="section-title">Consola de Infraestructura y Conectividad</h2>
      
      <div className="infra-grid">
        {/* Monitoreo del Servidor Local Core */}
        <div className={`infra-card ${systemStatus?.core?.toLowerCase() || 'online'}`}>
          <div className="infra-card-header">
            <h3>Servidor Core de Operaciones</h3>
            <span className="status-dot"></span>
          </div>
          <p className="infra-desc">Estado de la base de datos local y persistencia interna.</p>
          <div className="infra-actions">
            <span className="status-badge">{systemStatus?.core || 'ONLINE'}</span>
            <button 
              className="btn-toggle" 
              onClick={() => toggleStatus('core')}
            >
              Conmutar Estado
            </button>
          </div>
        </div>

        {/* Monitoreo de API Externa (Booknetic) */}
        <div className={`infra-card ${systemStatus?.api?.toLowerCase() || 'online'}`}>
          <div className="infra-card-header">
            <h3>Módulo de Sincronización (Booknetic API)</h3>
            <span className="status-dot"></span>
          </div>
          <p className="infra-desc">Encargada de impactar las reservas externas en el sistema.</p>
          <div className="infra-actions">
            <span className="status-badge">{systemStatus?.api || 'ONLINE'}</span>
            <button 
              className="btn-toggle" 
              onClick={() => toggleStatus('api')}
            >
              Conmutar Estado
            </button>
          </div>
        </div>
      </div>

      {/* Bloque Crítico de Contingencia si la API se cae */}
      {systemStatus?.api === 'OFFLINE' && (
        <div className="contingencia-alert animate-pulse">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h4>Protocolo de Contingencia Activo</h4>
            <p>La API de Booknetic se encuentra caída. Las reservas entrantes por la vía Web están retenidas. Por favor, solicite al personal de Recepción registrar los turnos de manera manual priorizando el canal de <strong>WhatsApp</strong>.</p>
          </div>
        </div>
      )}

      {/* Monitor de Canales de Entrada (Web vs WhatsApp) */}
      <div className="channels-monitor-section">
        <h3>Métricas de Tráfico por Canal</h3>
        <div className="channels-grid">
          <div className="channel-box web">
            <span className="channel-icon">🌐</span>
            <div className="channel-info">
              <h4>Canal Web</h4>
              <p className="channel-count">{viaWeb} <span>reservas</span></p>
            </div>
          </div>
          <div className="channel-box whatsapp">
            <span className="channel-icon">💬</span>
            <div className="channel-info">
              <h4>Canal WhatsApp</h4>
              <p className="channel-count">{viaWhatsApp} <span>reservas</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}