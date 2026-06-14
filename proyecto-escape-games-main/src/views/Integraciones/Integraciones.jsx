import React, { useState } from 'react';
import './Integraciones.css';

export default function Integraciones() {
  const [apiKey, setApiKey] = useState('********************************');
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="integraciones-view-container">
      
      {/* HEADER DE ESTADO */}
      <div className="integration-header-bar">
        <div className="status-indicator">
          <span className="dot green"></span>
          <h2>Booknetic <strong>Conectado</strong></h2>
        </div>
        <div className="url-display">
          https://escapelaberinto.com.ar/wp-json/booknetic/v1/
        </div>
      </div>

      <div className="integration-main-grid">
        
        {/* CAJA IZQUIERDA: ESTADO DE SINCRONIZACIÓN */}
        <div className="sync-status-box">
          <h3>Estado de sincronización</h3>
          
          <div className="status-list">
            <div className="status-item">
              <span>Información de la última conexión</span>
              <strong>/wp-json/booknetic/v1/</strong>
            </div>
            <div className="status-item">
              <span>URL</span>
              <strong>Hoy 14:33</strong>
            </div>
            <div className="status-item">
              <span>Última sync</span>
              <strong>24</strong>
            </div>
            <div className="status-item">
              <span>Reservas importadas</span>
              <span className="error-badge">0</span>
            </div>
            <div className="status-item">
              <span>Errores 24hs</span>
            </div>
          </div>
          
          <button className="btn-sync-now">Sincronizar ahora</button>
        </div>

        {/* CAJA DERECHA: CONFIGURACIÓN */}
        <div className="config-box">
          <h3>Configuración</h3>
          <p className="sub-header">Credenciales y frecuencia</p>
          
          <div className="form-group-config">
            <label>API Key</label>
            <div className="input-with-icon">
              <input 
                type={showKey ? "text" : "password"} 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
              />
              <button type="button" className="btn-toggle-eye" onClick={() => setShowKey(!showKey)}>
                <i className={`fa-solid ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="config-row-flex">
            <div className="form-group-config">
              <label>Frecuencia</label>
              <select defaultValue="5">
                <option value="5">Cada 5 minutos</option>
                <option value="15">Cada 15 minutes</option>
                <option value="60">Cada 1 hora</option>
              </select>
            </div>
            <div className="form-group-config">
              <label>Importar desde</label>
              <input type="date" defaultValue="2025-01-01" />
            </div>
          </div>

          <button className="btn-save-config">
            <i className="fa-solid fa-floppy-disk"></i> Guardar
          </button>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: LOG DE SINCRONIZACIÓN */}
      <div className="log-section">
        <h3>Log de sincronización</h3>
        <p className="sub-header">Últimas operaciones</p>
        <div className="terminal-log">
          <p>
            [14:33:01] OK Conectado a Booknetic API v3 <br />
            [14:33:02] OK 24 reservas obtenidas <br />
            [14:33:03] OK 3 reservas nuevas insertadas <br />
            [14:33:05] <strong>BADN R-882 sin teléfono</strong> - completar manualmente <br />
            [14:33:04] OK Sync completa en 2.4s
          </p>
        </div>
      </div>

    </div>
  );
}