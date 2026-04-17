'use client';

import { Tooltip } from 'antd';
import { createRoot, type Root } from 'react-dom/client';

const overflowRoots = new Map<HTMLElement, Root>();
const billingProductRoots = new Map<HTMLElement, Root>();

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
}

function pruneDisconnectedBillingProductRoots() {
  for (const [el, root] of billingProductRoots) {
    if (!el.isConnected) {
      try {
        root.unmount();
      } catch {
        /* noop */
      }
      billingProductRoots.delete(el);
    }
  }
}

function BillingProductCellTip({ html, title }: { html: string; title: string }) {
  const tip = title.trim().length > 0 ? title : undefined;
  return (
    <Tooltip
      title={tip}
      placement="topLeft"
      mouseEnterDelay={0.2}
      destroyOnHidden
      getPopupContainer={() => document.body}
    >
      <div
        className="billing-pos-product-stack-content"
        style={{
          minWidth: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Tooltip>
  );
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

/** Remove React mounts and unwrap helper divs under this host (e.g. table unmount). */
export function detachTabulatorOverflowTooltips(host: HTMLElement | null) {
  if (!host) return;
  host.querySelectorAll('[data-dt-billing-tip-root="1"]').forEach((node) => {
    const el = node as HTMLElement;
    const r = billingProductRoots.get(el);
    if (r) {
      try {
        r.unmount();
      } catch {
        /* noop */
      }
      billingProductRoots.delete(el);
    }
    el.parentElement?.removeAttribute('data-dt-billing-tip-enhanced');
    el.remove();
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
  pruneDisconnectedBillingProductRoots();

  const stacks = host.querySelectorAll('.billing-pos-product-stack');
  for (const node of stacks) {
    const stack = node as HTMLElement;
    const existingMount = stack.querySelector(
      ':scope > [data-dt-billing-tip-root="1"]',
    ) as HTMLElement | null;
    if (existingMount) {
      const hasRoot = billingProductRoots.has(existingMount);
      const hasTrigger = Boolean(
        existingMount.querySelector('.billing-pos-product-stack-content'),
      );
      if (hasRoot && hasTrigger) {
        continue;
      }
      const prev = billingProductRoots.get(existingMount);
      if (prev) {
        try {
          prev.unmount();
        } catch {
          /* noop */
        }
        billingProductRoots.delete(existingMount);
      }
      existingMount.remove();
      stack.removeAttribute('data-dt-billing-tip-enhanced');
      const backupHtml = stack.dataset.dtBillingRawHtml;
      if (backupHtml && !stack.innerHTML.trim()) {
        stack.innerHTML = backupHtml;
      }
    }

    const content = stack.querySelector(
      ':scope > .billing-pos-product-stack-content',
    ) as HTMLElement | null;
    const html = content ? content.innerHTML : stack.innerHTML;
    const fullTip =
      stack.dataset.fullTip?.trim() ||
      stack.getAttribute('title')?.trim() ||
      '';

    if (!html.trim()) continue;

    stack.dataset.dtBillingRawHtml = html;
    stack.removeAttribute('title');
    stack.replaceChildren();

    const mount = document.createElement('div');
    mount.setAttribute('data-dt-billing-tip-root', '1');
    mount.style.cssText =
      'flex:1;min-width:0;width:100%;display:flex;flex-direction:column;';
    stack.appendChild(mount);

    const root = createRoot(mount);
    billingProductRoots.set(mount, root);
    stack.setAttribute('data-dt-billing-tip-enhanced', '1');
    root.render(<BillingProductCellTip html={html} title={fullTip} />);
  }
}

export function attachTabulatorOverflowTooltips(host: HTMLElement | null) {
  if (!host || typeof document === 'undefined') return;
  pruneDisconnectedRoots();
  pruneDisconnectedBillingProductRoots();

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
}
