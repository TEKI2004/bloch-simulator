import type { Complex } from "./Complex";

export function formatNumber(value: number): number {
  if (Math.abs(value) < 1e-10) return 0;
  return Number(value.toFixed(4));
}

export function formatComplex(value: Complex): string {
  const re = formatNumber(value.re);
  const im = formatNumber(value.im);

  if (im === 0) return `${re}`;
  if (re === 0) return `${im}i`;

  return `${re} ${im < 0 ? "-" : "+"} ${Math.abs(im)}i`;
}
