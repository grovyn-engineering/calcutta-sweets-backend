'use client';

import React from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  height?: string | number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  description, 
  icon, 
  action,
  height = 'auto'
}) => {
  return (
    <div className={styles.container} style={{ minHeight: height }}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.message}>{message}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};
