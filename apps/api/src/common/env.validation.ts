/**
 * Validates process env at boot (ConfigModule.forRoot({ validate })). Fails fast instead
 * of silently falling back to insecure defaults.
 */
export function validateEnv(config: Record<string, unknown>) {
  const errors: string[] = [];
  const str = (k: string) => {
    const v = config[k];
    return typeof v === 'string' ? v.trim() : '';
  };
  const isProd = str('NODE_ENV') === 'production';

  if (!str('DATABASE_URL')) errors.push('DATABASE_URL is required');

  const jwt = str('JWT_SECRET');
  if (!jwt) errors.push('JWT_SECRET is required');
  else if (jwt === 'change-me-in-production')
    errors.push('JWT_SECRET must not be the placeholder value');
  else if (isProd && jwt.length < 32)
    errors.push('JWT_SECRET must be at least 32 characters in production');

  if (isProd) {
    for (const k of [
      'PAYTM_MID',
      'PAYTM_MERCHANT_KEY',
      'RESEND_API_KEY',
      'REDIS_URL',
      'APP_URL',
      'FRONTEND_URL',
    ]) {
      if (!str(k)) errors.push(`${k} is required in production`);
    }
    if (str('PAYTM_SKIP_STATUS_VERIFY') === '1')
      errors.push('PAYTM_SKIP_STATUS_VERIFY cannot be enabled in production');
  }
  const paytmKey = str('PAYTM_MERCHANT_KEY');
  if (paytmKey && paytmKey.length !== 16)
    errors.push('PAYTM_MERCHANT_KEY must be exactly 16 characters');

  const keepWarmUrl = str('KEEP_WARM_URL');
  if (keepWarmUrl && keepWarmUrl !== 'off' && !/^https?:\/\//.test(keepWarmUrl))
    errors.push('KEEP_WARM_URL must be an http(s) URL or "off"');
  const keepWarmMs = str('KEEP_WARM_INTERVAL_MS');
  if (keepWarmMs && !(Number(keepWarmMs) >= 1000))
    errors.push(
      'KEEP_WARM_INTERVAL_MS must be a number of milliseconds (at least 1000)',
    );

  if (errors.length) {
    throw new Error(`Invalid environment:\n  - ${errors.join('\n  - ')}`);
  }
  return config;
}
