import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';

/** Render's free plan sleeps a web service after 15 minutes without inbound traffic. */
const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Pings this API's own public `/health` URL on a timer. The request goes out through
 * Render's edge and back in, so it counts as inbound traffic and the service never idles
 * long enough to sleep (which costs users a 30-60s cold start).
 *
 * `/health` does no DB I/O on purpose: Neon is left to auto-suspend, since keeping it
 * awake around the clock would use up the free plan's compute hours.
 *
 * On by default on Render (which sets RENDER_EXTERNAL_URL); elsewhere set KEEP_WARM_URL.
 * KEEP_WARM_URL=off disables it.
 */
@Injectable()
export class KeepWarmService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(KeepWarmService.name);
  private timer: NodeJS.Timeout | null = null;

  onApplicationBootstrap() {
    const explicit = process.env.KEEP_WARM_URL?.trim();
    if (explicit === 'off') return;
    const base = (
      explicit ||
      process.env.RENDER_EXTERNAL_URL?.trim() ||
      ''
    ).replace(/\/+$/, '');
    if (!base) return;

    const intervalMs =
      parseInt(process.env.KEEP_WARM_INTERVAL_MS ?? '', 10) ||
      DEFAULT_INTERVAL_MS;
    const url = `${base}/health`;
    this.timer = setInterval(() => void this.ping(url), intervalMs);
    // Never hold the process open just for the pinger (clean shutdown on deploys).
    this.timer.unref();
    this.logger.log(`Pinging ${url} every ${Math.round(intervalMs / 1000)}s`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async ping(url: string) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) this.logger.warn(`Keep-warm ping got HTTP ${res.status}`);
    } catch (err) {
      this.logger.warn(
        `Keep-warm ping failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
