// src/views/Usuarios/Usuarios.jsx
import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import './Usuarios.css';

const ROLES = ['ADMINISTRADOR', 'RECEPCIONISTA', 'ANALISTA'];

export default function Usuarios() {
  const { users, setUsers, currentUser, triggerToast } = useContext(AppContext);



  const [modalAgregar, setModalAgregar]   = useState(false);
  const [modalEditar, setModalEditar]     = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [formNuevo, setFormNuevo]         = useState({ nombre: '', email: '', password: '', rol: 'RECEPCIONISTA' });
  const [formEditar, setFormEditar]       = useState({});

  const agregarUsuario = () => {
    if (!formNuevo.nombre || !formNuevo.email || !formNuevo.password) {
      triggerToast('Completá todos los campos'); return;
    }
    setUsers((prev) => [...prev, { id: Date.now(), ...formNuevo }]);
    setModalAgregar(false);
    setFormNuevo({ nombre: '', email: '', password: '', rol: 'RECEPCIONISTA' });
    triggerToast('Usuario creado correctamente');
  };

  const abrirEditar = (u) => { setFormEditar({ ...u }); setModalEditar(u); };

  const guardarEdicion = () => {
    setUsers((prev) => prev.map((u) => u.id === formEditar.id ? { ...formEditar } : u));
    setModalEditar(null);
    triggerToast('Usuario actualizado correctamente');
  };

  const confirmarEliminar = () => {
    if (modalEliminar.id === currentUser.id) {
      triggerToast('No podés eliminar tu propio usuario');
      setModalEliminar(null); return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== modalEliminar.id));
    setModalEliminar(null);
    triggerToast('Usuario eliminado');
  };

  const AVATAR_COLORS = ['#6366f1','#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6'];
  const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

  return (
    <div className="usr-container">

      {/* ── Header ── */}
      <div className="usr-header">
        <div>
          <h1 className="usr-title">Usuarios</h1>
          <p className="usr-subtitle">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModalAgregar(true)}>+ Nuevo usuario</button>
      </div>

      {/* ── Grid ── */}
      <div className="usr-grid">
        {users.map((u) => (
          <div key={u.id} className="usr-card">
            <div className="usr-avatar" style={{ background: avatarColor(u.id) }}>
              {u.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="usr-info">
              <span className="usr-nombre">{u.nombre}</span>
              <span className="usr-email">{u.email}</span>
              <span className={`usr-rol usr-rol--${u.rol.toLowerCase()}`}>{u.rol}</span>
            </div>
            <div className="usr-acciones">
              <button className="rv-btn rv-btn--editar" title="Editar" onClick={() => abrirEditar(u)}>✏️</button>
              <button
                className="rv-btn rv-btn--eliminar"
                title="Eliminar"
                onClick={() => setModalEliminar(u)}
                disabled={u.id === currentUser.id}
              >🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal Agregar ── */}
      {modalAgregar && (
        <div className="modal-overlay" onClick={() => setModalAgregar(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Usuario</h2>
              <button className="modal-close" onClick={() => setModalAgregar(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field form-field--full">
                  <label className="form-label">Nombre completo</label>
                  <input className="form-input" placeholder="Ej: Recepción Local"
                    value={formNuevo.nombre} onChange={(e) => setFormNuevo({ ...formNuevo, nombre: e.target.value })} />
                </div>
                <div className="form-field form-field--full">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="usuario@escaperoom.com"
                    value={formNuevo.email} onChange={(e) => setFormNuevo({ ...formNuevo, email: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Contraseña</label>
                  <input type="password" className="form-input" placeholder="••••••••"
                    value={formNuevo.password} onChange={(e) => setFormNuevo({ ...formNuevo, password: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Rol</label>
                  <select className="form-input" value={formNuevo.rol}
                    onChange={(e) => setFormNuevo({ ...formNuevo, rol: e.target.value })}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalAgregar(false)}>Cancelar</button>
              <button className="btn-primary" onClick={agregarUsuario}>Crear usuario</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar ── */}
      {modalEditar && (
        <div className="modal-overlay" onClick={() => setModalEditar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Usuario</h2>
              <button className="modal-close" onClick={() => setModalEditar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field form-field--full">
                  <label className="form-label">Nombre completo</label>
                  <input className="form-input" value={formEditar.nombre}
                    onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })} />
                </div>
                <div className="form-field form-field--full">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={formEditar.email}
                    onChange={(e) => setFormEditar({ ...formEditar, email: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Contraseña</label>
                  <input type="password" className="form-input" value={formEditar.password}
                    onChange={(e) => setFormEditar({ ...formEditar, password: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Rol</label>
                  <select className="form-input" value={formEditar.rol}
                    onChange={(e) => setFormEditar({ ...formEditar, rol: e.target.value })}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalEditar(null)}>Cancelar</button>
              <button className="btn-primary" onClick={guardarEdicion}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Eliminar ── */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar Usuario</h2>
              <button className="modal-close" onClick={() => setModalEliminar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-warn">
                ¿Confirmás que querés eliminar a <strong>{modalEliminar.nombre}</strong>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalEliminar(null)}>Cancelar</button>
              <button className="btn-danger" onClick={confirmarEliminar}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
