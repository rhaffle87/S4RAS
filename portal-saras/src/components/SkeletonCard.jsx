import React from 'react';

function SkeletonCard({ lines = 3, showIcon = false }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {showIcon && <div className="skeleton skeleton-icon" />}
      <div className="skeleton-content">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton skeleton-line"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    </div>
  );
}

export default SkeletonCard;
