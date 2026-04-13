import styles from './LoadingDots.module.css';

interface LoadingDotsProps {
  fullScreen?: boolean;
}

export function LoadingDots({ fullScreen }: LoadingDotsProps) {
  return (
    <div
      className={fullScreen ? styles.fullScreen : styles.container}
      role="status"
      aria-label="Loading"
    >
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  );
}
