export class Complex {
  readonly re: number;
  readonly im: number;

  constructor(re: number, im: number = 0) {
    this.re = re;
    this.im = im;
  }

  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  sub(other: Complex): Complex {
    return new Complex(this.re - other.re, this.im - other.im);
  }

  mul(other: Complex): Complex {
    return new Complex(this.re * other.re - this.im * other.im, this.re * other.im + this.im * other.re);
  }

  scale(value: number): Complex {
    return new Complex(this.re * value, this.im * value);
  }

  conjugate(): Complex {
    return new Complex(this.re, -this.im);
  }

  absSquared(): number {
    return this.re ** 2 + this.im ** 2;
  }

  static fromPolar(angle: number): Complex {
    return new Complex(Math.cos(angle), Math.sin(angle));
  }
}
