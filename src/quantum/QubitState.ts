import { Complex } from "./Complex";

export class QubitState {
  readonly alpha: Complex;
  readonly beta: Complex;

  constructor(alpha: Complex, beta: Complex) {
    this.alpha = alpha;
    this.beta = beta;
  }

  normSquared(): number {
    return this.alpha.absSquared() + this.beta.absSquared();
  }

  normalized(): QubitState {
    const norm = Math.sqrt(this.normSquared());

    if (!Number.isFinite(norm) || norm === 0) {
      throw new Error("Cannot normalize an invalid or zero qubit state.");
    }

    return new QubitState(this.alpha.scale(1 / norm), this.beta.scale(1 / norm));
  }

  static zero(): QubitState {
    return new QubitState(new Complex(1), new Complex(0));
  }

  static one(): QubitState {
    return new QubitState(new Complex(0), new Complex(1));
  }

  static fromAngles(theta: number, phi: number): QubitState {
    return new QubitState(new Complex(Math.cos(theta / 2)), Complex.fromPolar(phi).scale(Math.sin(theta / 2)));
  }
}
