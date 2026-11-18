import { QubitState } from "./QubitState";

export type BlochVector = [number, number, number];

export function toBlochVector(state: QubitState): BlochVector {
  const { alpha, beta } = state.normalized();
  const product = alpha.conjugate().mul(beta);

  return [2 * product.re, 2 * product.im, alpha.absSquared() - beta.absSquared()];
}
