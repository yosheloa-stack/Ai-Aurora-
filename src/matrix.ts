// Operações básicas de vetor/matriz usadas pela rede neural.
// Implementadas manualmente (sem TensorFlow/PyTorch) para que o funcionamento
// interno da IA fique visível e compreensível.

export type Vector = number[];
export type Matrix = number[][];

export function zerosVector(n: number): Vector {
  return new Array(n).fill(0);
}

export function zerosMatrix(rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, () => zerosVector(cols));
}

export function randomMatrix(rows: number, cols: number, scale = 0.01): Matrix {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() * 2 - 1) * scale)
  );
}

export function matVecMul(m: Matrix, v: Vector): Vector {
  const out = zerosVector(m.length);
  for (let i = 0; i < m.length; i++) {
    let sum = 0;
    const row = m[i];
    for (let j = 0; j < row.length; j++) sum += row[j] * v[j];
    out[i] = sum;
  }
  return out;
}

export function addVec(a: Vector, b: Vector): Vector {
  return a.map((v, i) => v + b[i]);
}

export function tanhVec(v: Vector): Vector {
  return v.map(Math.tanh);
}

export function softmax(v: Vector): Vector {
  const max = Math.max(...v);
  const exps = v.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}
