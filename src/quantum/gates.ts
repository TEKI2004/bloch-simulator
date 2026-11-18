import { Complex } from "./Complex";
import type { Matrix2 } from "./Matrix2";

const c = (re: number, im = 0) => new Complex(re, im);
const zero = c(0);
const one = c(1);

// Alapkapuk

export const I: Matrix2 = [
  [one, zero],
  [zero, one],
];

export const X: Matrix2 = [
  [zero, one],
  [one, zero],
];

export const Y: Matrix2 = [
  [zero, c(0, -1)],
  [c(0, 1), zero],
];

export const Z: Matrix2 = [
  [one, zero],
  [zero, c(-1)],
];

export const H: Matrix2 = [
  [c(1 / Math.SQRT2), c(1 / Math.SQRT2)],
  [c(1 / Math.SQRT2), c(-1 / Math.SQRT2)],
];

// Fáziskapuk

export function P(lambda: number): Matrix2 {
  return [
    [one, zero],
    [zero, Complex.fromPolar(lambda)],
  ];
}

export const S: Matrix2 = P(Math.PI / 2);
export const Sdg: Matrix2 = P(-Math.PI / 2);

export const T: Matrix2 = P(Math.PI / 4);
export const Tdg: Matrix2 = P(-Math.PI / 4);

// Forgatási kapuk

export function Rx(theta: number): Matrix2 {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);

  return [
    [c(cos), c(0, -sin)],
    [c(0, -sin), c(cos)],
  ];
}

export function Ry(theta: number): Matrix2 {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);

  return [
    [c(cos), c(-sin)],
    [c(sin), c(cos)],
  ];
}

export function Rz(theta: number): Matrix2 {
  return [
    [Complex.fromPolar(-theta / 2), zero],
    [zero, Complex.fromPolar(theta / 2)],
  ];
}
