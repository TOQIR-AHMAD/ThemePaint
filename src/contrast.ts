/**
 * WCAG 2.x contrast ratio utilities.
 * Supports #RGB, #RRGGBB and #RRGGBBAA (alpha is composited over a base).
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseHex(hex: string): Rgb | undefined {
  if (!hex) {
    return undefined;
  }
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (h.length === 4) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (h.length === 6) {
    h += "ff";
  }
  if (h.length !== 8 || /[^0-9a-fA-F]/.test(h)) {
    return undefined;
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: parseInt(h.slice(6, 8), 16) / 255,
  };
}

/** Composite a possibly-translucent foreground over an opaque background. */
function composite(fg: Rgb, bg: Rgb): Rgb {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Contrast ratio between fg (composited over bg) and bg. Returns undefined if unparseable. */
export function contrastRatio(fgHex: string, bgHex: string): number | undefined {
  const fg = parseHex(fgHex);
  const bg = parseHex(bgHex);
  if (!fg || !bg) {
    return undefined;
  }
  const composedFg = fg.a < 1 ? composite(fg, { ...bg, a: 1 }) : fg;
  const l1 = relativeLuminance(composedFg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastResult {
  ratio: number;
  aaNormal: boolean; // >= 4.5
  aaLarge: boolean; // >= 3.0
  aaaNormal: boolean; // >= 7.0
}

export function evaluateContrast(fgHex: string, bgHex: string): ContrastResult | undefined {
  const ratio = contrastRatio(fgHex, bgHex);
  if (ratio === undefined) {
    return undefined;
  }
  return {
    ratio: Math.round(ratio * 100) / 100,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3.0,
    aaaNormal: ratio >= 7.0,
  };
}
