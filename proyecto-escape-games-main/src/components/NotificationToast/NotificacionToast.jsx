// src/components/notification/NotificationToast.jsx
import React, { useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import './NotificationToast.css';

export default function NotificationToast() {
  const { toastMessage, setToastMessage } = useContext(AppContext);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3500); // Se borra automáticamente a los 3.5 segundos
      return () => clearTimeout(timer);
    }
  }, [toastMessage, setToastMessage]);

  if (!toastMessage) return null;

  return (
    <div className="toast-container">
      🔔 {toastMessage}
    </div>
  );
}