'use client';

import { Tooltip, Typography } from 'antd';
import { createRoot, type Root } from 'react-dom/client';

const overflowRoots = new Map<HTMLElement, Root>();
const billingLineRoots = new Map<HTMLElement, Root>();

function healEmptyBillingLineMounts(host: HTMLElement | null) {
  if (!host) return;
  host.querySelectorAll('[data-dt-billing-line-tip-root="1"]').forEach((node) => {
    const el = node as HTMLElement;
    const empty =
      el.childElementCount === 0 && (el.textContent?.trim() ?? '') === '';
    if (!empty) return;
    const r = billingLineRoots.get(el);
    if (r) {
      try {
        r.unmount();
      } catch {
        /* noop */
      }
      billingLineRoots.delete(el);
    }
    const parent = el.parentElement;
    const cls = el.dataset.dtBillingLineRestoreClass ?? '';
    const txt = el.dataset.dtBillingLineRestoreText ?? '';
    if (parent) {
      const div = document.createElement('div');
      if (cls) div.className = cls;
      div.textContent = txt;
      parent.replaceChild(div, el);
    }
  });
}

function pruneDisconnectedRoots() {
  for (const [el, root] of overflowRoots) {
    if (!el.isConnected) {
      try {
        root.unmount();
      } catch {
        /* noop */
      }
      overflowRoots.delete(el);
    }
  }
  for (const [el, root] of billingLineRoots) {
    if (!el.isConnected) {
      try {
        root.unmount();
      } catch {
      }
      billingLineRoots.delete(el);
    }
  }
}

function shouldSkipOverflowCell(cell: HTMLElement): boolean {
  if (cell.hasAttribute('data-skip-overflow-tooltip')) return true;
  if (cell.querySelector('[data-skip-overflow-tooltip]')) return true;
  if (
    cell.querySelector(
      'button, input, select, textarea, [role="button"], img, video, canvas, a[href], .tabulator-row-handle',
    )
  ) {
    return true;
  }
  return false;
}

function CellOverflowTip({
  html,
  text,
}: {
  html: string;
  text: string;
}) {
  return (
    <Tooltip title={text} placement="topLeft" mouseEnterDelay={0.35} destroyOnHidden>
      <div
        className="dt-tabulator-cell-ellipsis"
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          width: '100%',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Tooltip>
  );
}

function BillingLineTypographyEllipsis({
  className,
  text,
}: {
  className: string;
  text: string;
}) {
  return (
    <Typography.Text
      className={className}
      ellipsis={{
        tooltip: {
          title: text,
          placement: 'topLeft',
          mouseEnterDelay: 0.35,
          destroyOnHidden: true,
        },
      }}
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '100%',
        marginBottom: 0,
      }}
    >
      {text}
    </Typography.Text>
  );
}

export function detachTabulatorOverflowTooltips(host: HTMLElement | null) {
  if (!host) return;

  host.querySelectorAll('[data-dt-billing-line-tip-root="1"]').forEach((node) => {
    const el = node as HTMLElement;
    const r = billingLineRoots.get(el);
    if (r) {
      try {
        r.unmount();
      } catch {
        /* noop */
      }
      billingLineRoots.delete(el);
    }
    const parent = el.parentElement;
    const cls = el.dataset.dtBillingLineRestoreClass ?? '';
    const txt = el.dataset.dtBillingLineRestoreText ?? '';
    if (parent) {
      const div = document.createElement('div');
      if (cls) div.className = cls;
      div.textContent = txt;
      parent.replaceChild(div, el);
    } else {
      el.remove();
    }
  });

  host.querySelectorAll('[data-dt-billing-tip-root="1"]').forEach((node) => {
    const el = node as HTMLElement;
    const stack = el.parentElement;
    el.remove();
    if (!stack?.classList.contains('billing-pos-product-stack')) return;
    stack.removeAttribute('data-dt-billing-tip-enhanced');
    const backup = stack.dataset.dtBillingRawHtml;
    if (backup?.trim() && !stack.querySelector('.billing-pos-product-stack-content')) {
      const inner = document.createElement('div');
      inner.className = 'billing-pos-product-stack-content';
      inner.innerHTML = backup;
      stack.appendChild(inner);
    }
  });

  const mounts = host.querySelectorAll('[data-dt-overflow-root="1"]');
  mounts.forEach((node) => {
    const el = node as HTMLElement;
    const r = overflowRoots.get(el);
    if (r) {
      try {
        r.unmount();
      } catch {
        /* noop */
      }
      overflowRoots.delete(el);
    }
    const parent = el.parentElement;
    if (parent) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      el.remove();
    }
  });
}

function attachBillingPosProductTooltips(host: HTMLElement | null) {
  if (!host) return;

  healEmptyBillingLineMounts(host);

  const stacks = host.querySelectorAll('.billing-pos-product-stack');
  for (const node of stacks) {
    const stack = node as HTMLElement;

    const legacyMount = stack.querySelector(
      ':scope > [data-dt-billing-tip-root="1"]',
    ) as HTMLElement | null;
    if (legacyMount) {
      legacyMount.remove();
      stack.removeAttribute('data-dt-billing-tip-enhanced');
      const backupHtml = stack.dataset.dtBillingRawHtml;
      if (backupHtml?.trim()) {
        stack.replaceChildren();
        const inner = document.createElement('div');
        inner.className = 'billing-pos-product-stack-content';
        inner.innerHTML = backupHtml;
        stack.appendChild(inner);
      }
    }

    if (
      !stack.querySelector(':scope > .billing-pos-product-stack-content') &&
      stack.childNodes.length > 0
    ) {
      const inner = document.createElement('div');
      inner.className = 'billing-pos-product-stack-content';
      while (stack.firstChild) inner.appendChild(stack.firstChild);
      stack.appendChild(inner);
    }

    const contentEl = stack.querySelector(
      ':scope > .billing-pos-product-stack-content',
    ) as HTMLElement | null;
    if (contentEl?.innerHTML.trim() && !stack.dataset.dtBillingRawHtml) {
      stack.dataset.dtBillingRawHtml = contentEl.innerHTML;
    }

    stack.removeAttribute('title');

    if (!contentEl) continue;

    for (const sel of [
      ':scope > .billing-pos-product-title',
      ':scope > .billing-pos-product-sub',
    ] as const) {
      const lineEls = contentEl.querySelectorAll(sel);
      for (const n of lineEls) {
        const lineEl = n as HTMLElement;
        if (lineEl.closest('[data-dt-billing-line-tip-root="1"]')) continue;
        const text = lineEl.textContent?.trim() ?? '';
        if (!text) continue;

        const cls = lineEl.className;
        const mount = document.createElement('div');
        mount.setAttribute('data-dt-billing-line-tip-root', '1');
        mount.dataset.dtBillingLineRestoreText = text;
        mount.dataset.dtBillingLineRestoreClass = cls;
        mount.style.cssText = 'min-width:0;width:100%;';

        lineEl.replaceWith(mount);
        const prev = billingLineRoots.get(mount);
        if (prev) {
          try {
            prev.unmount();
          } catch {
            /* noop */
          }
          billingLineRoots.delete(mount);
        }
        const root = createRoot(mount);
        billingLineRoots.set(mount, root);
        root.render(<BillingLineTypographyEllipsis className={cls} text={text} />);
      }
    }
  }
}

export function attachTabulatorOverflowTooltips(host: HTMLElement | null) {
  if (!host || typeof document === 'undefined') return;
  pruneDisconnectedRoots();

  const cells = host.querySelectorAll(
    '.tabulator-table .tabulator-row .tabulator-cell',
  );
  for (const cell of cells) {
    const cellEl = cell as HTMLElement;
    if (shouldSkipOverflowCell(cellEl)) continue;

    const existingMount = cellEl.querySelector(
      ':scope > [data-dt-overflow-root="1"]',
    ) as HTMLElement | null;
    if (existingMount) {
      const hasRoot = overflowRoots.has(existingMount);
      const hasTrigger = Boolean(
        existingMount.querySelector('.dt-tabulator-cell-ellipsis'),
      );
      if (hasRoot && hasTrigger) {
        continue;
      }
      const prev = overflowRoots.get(existingMount);
      if (prev) {
        try {
          prev.unmount();
        } catch {
          /* noop */
        }
        overflowRoots.delete(existingMount);
      }
      existingMount.remove();
      const backupHtml = cellEl.dataset.dtOverflowRawHtml;
      if (backupHtml && !cellEl.innerHTML.trim()) {
        cellEl.innerHTML = backupHtml;
      }
    }

    const html = cellEl.innerHTML.trim();
    const text = cellEl.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (!html || !text) continue;

    const wrap = document.createElement('div');
    wrap.setAttribute('data-dt-overflow-root', '1');
    wrap.style.cssText =
      'flex:1;min-width:0;overflow:hidden;display:flex;align-items:center;';
    while (cellEl.firstChild) wrap.appendChild(cellEl.firstChild);
    cellEl.appendChild(wrap);

    const over =
      wrap.scrollWidth > wrap.clientWidth + 1 ||
      wrap.scrollHeight > wrap.clientHeight + 1;
    const innerHtml = wrap.innerHTML;
    const innerText = wrap.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    cellEl.dataset.dtOverflowRawHtml = innerHtml;
    if (!over || !innerText) {
      while (wrap.firstChild) cellEl.insertBefore(wrap.firstChild, wrap);
      wrap.remove();
      continue;
    }

    wrap.replaceChildren();
    const root = createRoot(wrap);
    overflowRoots.set(wrap, root);
    root.render(<CellOverflowTip html={innerHtml} text={innerText} />);
  }

  attachBillingPosProductTooltips(host);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      attachBillingPosProductTooltips(host);
    });
  });
}
