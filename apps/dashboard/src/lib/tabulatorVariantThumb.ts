import styles from "./tabulatorVariantThumb.module.css";

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><line x1="3" x2="21" y1="3" y2="21"/></svg>`;

function mountPlaceholder(wrap: HTMLDivElement) {
  wrap.innerHTML = PLACEHOLDER_SVG;
  const svg = wrap.querySelector("svg");
  if (svg) svg.setAttribute("class", styles.placeholderIcon);
}

export function createTabulatorVariantThumb(
  imageUrl: string | null | undefined,
  ariaLabel: string,
): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = styles.wrap;
  const label = ariaLabel.trim() || "Product";
  wrap.title = label;

  const url = (imageUrl ?? "").trim();
  if (!url) {
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", `No image for ${label}`);
    mountPlaceholder(wrap);
    return wrap;
  }

  const img = document.createElement("img");
  img.className = styles.img;
  img.alt = label;
  img.loading = "lazy";
  img.decoding = "async";
  img.referrerPolicy = "no-referrer";
  img.src = url;
  img.addEventListener("error", () => {
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", `No image for ${label}`);
    mountPlaceholder(wrap);
  });
  wrap.appendChild(img);
  return wrap;
}
