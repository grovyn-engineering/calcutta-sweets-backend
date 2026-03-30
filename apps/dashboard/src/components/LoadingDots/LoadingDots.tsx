import styles from './LoadingDots.module.css';

export function LoadingDots() {
  return (
    <div className={styles.container} role="status" aria-label="Loading">
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  );
}
