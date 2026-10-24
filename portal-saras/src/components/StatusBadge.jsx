import React from 'react';
import { Circle } from 'lucide-react';

function StatusBadge({ status, label }) {
  const isOnline = status === 'online';

  return (
    <span
      className={`status-badge ${isOnline ? 'status-badge--online' : 'status-badge--offline'}`}
      role="status"
      aria-label={`${label}: ${isOnline ? 'online' : 'offline'}`}
    >
      <Circle
        size={8}
        fill="currentColor"
        strokeWidth={0}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export default StatusBadge;
