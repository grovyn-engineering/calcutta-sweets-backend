'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ContentSkeleton } from '@/components/ContentSkeleton/ContentSkeleton';

import styles from './AuthGuard.module.css';

const PROTECTED_PATHS = [
  '/dashboard',
  '/billing-pos',
  '/orders',
  '/products',
  '/inventory',
  '/categories',
  '/reports',
  '/users',
  '/settings',
  '/shops',
  '/logout',
];

const SUPER_ADMIN_PATHS = ['/users'];

function isProtectedPath(path: string) {
  if (path === '/') return true;
  return PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

function isSuperAdminOnlyPath(path: string) {
  return SUPER_ADMIN_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Protects (app) routes. Wraps the full AppLayout so the session loader can cover
 * the entire viewport (sidebar + header + main), not only the content column.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && isProtectedPath(pathname)) {
      router.replace('/login');
    }
  }, [pathname, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (isSuperAdminOnlyPath(pathname) && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [pathname, isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className={styles.bootstrapShell} role="status" aria-live="polite" aria-label="Loading session">
        <ContentSkeleton variant="table" rowCount={10} />
      </div>
    );
  }

  if (!isAuthenticated && isProtectedPath(pathname)) {
    return (
      <div className={styles.bootstrapShell} role="status" aria-live="polite" aria-label="Redirecting">
        <ContentSkeleton variant="table" rowCount={6} />
      </div>
    );
  }

  if (
    isAuthenticated &&
    user &&
    isSuperAdminOnlyPath(pathname) &&
    user.role !== 'SUPER_ADMIN'
  ) {
    return (
      <div className={styles.bootstrapShell} role="status" aria-live="polite" aria-label="Redirecting">
        <ContentSkeleton variant="table" rowCount={6} />
      </div>
    );
  }

  return <>{children}</>;
}
