// src/views/inicio/components/metricCard/MetricCard.jsx
import React from 'react';
import './MetricCard.css';

export default function MetricCard({ label, value, variant = '' }) {
  // Construimos las clases: 'metric-card' siempre va, y si viene una variante se acopla
  const clasesCard = variant ? `metric-card ${variant}` : 'metric-card';

  return (
    <div className={clasesCard}>
      <div className="metric-label">{label}</div>
      <p className="metric-value">{value}</p>
    </div>
  );
}