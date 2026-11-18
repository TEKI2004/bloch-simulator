
import { Complex } from "./Complex";
import { QubitState } from "./QubitState";

export type Matrix2 = readonly [
  readonly [Complex, Complex],
  readonly [Complex, Complex],
];

export function apply(matrix: Matrix2, state: QubitState): QubitState {
  const [[a, b], [c, d]] = matrix;
  const { alpha, beta } = state;
  
  return new QubitState(
    a.mul(alpha).add(b.mul(beta)),
    c.mul(alpha).add(d.mul(beta)),
  );
}

export function multiply(a: Matrix2, b: Matrix2): Matrix2 {
  return [
    [
      a[0][0].mul(b[0][0]).add(a[0][1].mul(b[1][0])),
      a[0][0].mul(b[0][1]).add(a[0][1].mul(b[1][1])),
    ],
    [
      a[1][0].mul(b[0][0]).add(a[1][1].mul(b[1][0])),
      a[1][0].mul(b[0][1]).add(a[1][1].mul(b[1][1])),
    ],
  ];
}
