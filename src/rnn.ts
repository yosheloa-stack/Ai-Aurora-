// IA própria: uma Rede Neural Recorrente (RNN) a nível de caractere.
// Aprende a prever o próximo caractere de um texto, e por isso consegue
// gerar texto novo, caractere a caractere, no mesmo "estilo" do que aprendeu.
//
// Baseada no algoritmo clássico de RNN com Backpropagation Through Time (BPTT)
// e otimização via Adagrad — implementada aqui do zero, sem bibliotecas de ML.

import {
  Matrix,
  Vector,
  zerosMatrix,
  zerosVector,
  randomMatrix,
  matVecMul,
  addVec,
  tanhVec,
  softmax,
} from "./matrix";

export interface RNNParams {
  Wxh: Matrix; // entrada -> estado oculto
  Whh: Matrix; // estado oculto anterior -> estado oculto
  Why: Matrix; // estado oculto -> saída
  bh: Vector; // viés do estado oculto
  by: Vector; // viés da saída
}

export class CharRNN {
  readonly vocabSize: number;
  readonly hiddenSize: number;
  params: RNNParams;
  private mem: RNNParams; // memória de gradientes ao quadrado (Adagrad)

  constructor(vocabSize: number, hiddenSize = 100) {
    this.vocabSize = vocabSize;
    this.hiddenSize = hiddenSize;
    this.params = {
      Wxh: randomMatrix(hiddenSize, vocabSize),
      Whh: randomMatrix(hiddenSize, hiddenSize),
      Why: randomMatrix(vocabSize, hiddenSize),
      bh: zerosVector(hiddenSize),
      by: zerosVector(vocabSize),
    };
    this.mem = {
      Wxh: zerosMatrix(hiddenSize, vocabSize),
      Whh: zerosMatrix(hiddenSize, hiddenSize),
      Why: zerosMatrix(vocabSize, hiddenSize),
      bh: zerosVector(hiddenSize),
      by: zerosVector(vocabSize),
    };
  }

  private oneHot(ix: number): Vector {
    const v = zerosVector(this.vocabSize);
    v[ix] = 1;
    return v;
  }

  // Um passo do modelo: dado um caractere de entrada e o estado oculto
  // anterior, calcula os logits de saída e o novo estado oculto.
  step(ix: number, hPrev: Vector): { y: Vector; h: Vector } {
    const { Wxh, Whh, Why, bh, by } = this.params;
    const x = this.oneHot(ix);
    const h = tanhVec(addVec(addVec(matVecMul(Wxh, x), matVecMul(Whh, hPrev)), bh));
    const y = addVec(matVecMul(Why, h), by);
    return { y, h };
  }

  // Executa forward + backward (BPTT) sobre um trecho de texto e atualiza
  // os pesos do modelo. Retorna a perda (loss) e o estado oculto final,
  // que deve ser reaproveitado no próximo trecho para manter a "memória".
  lossAndGrad(
    inputs: number[],
    targets: number[],
    hPrev: Vector,
    learningRate: number
  ): { loss: number; hNext: Vector } {
    const { Wxh, Whh, Why } = this.params;
    const xs: Vector[] = [];
    const hs: Vector[] = [hPrev];
    const ps: Vector[] = [];
    let loss = 0;

    // --- forward pass ---
    for (let t = 0; t < inputs.length; t++) {
      const x = this.oneHot(inputs[t]);
      xs.push(x);
      const { y, h } = this.step(inputs[t], hs[t]);
      hs.push(h);
      const p = softmax(y);
      ps.push(p);
      loss += -Math.log(p[targets[t]] + 1e-12);
    }

    // --- backward pass (through time) ---
    const dWxh = zerosMatrix(this.hiddenSize, this.vocabSize);
    const dWhh = zerosMatrix(this.hiddenSize, this.hiddenSize);
    const dWhy = zerosMatrix(this.vocabSize, this.hiddenSize);
    const dbh = zerosVector(this.hiddenSize);
    const dby = zerosVector(this.vocabSize);
    let dhNext = zerosVector(this.hiddenSize);

    for (let t = inputs.length - 1; t >= 0; t--) {
      const dy = ps[t].slice();
      dy[targets[t]] -= 1; // gradiente da softmax + entropia cruzada

      for (let i = 0; i < this.vocabSize; i++) {
        dby[i] += dy[i];
        for (let j = 0; j < this.hiddenSize; j++) {
          dWhy[i][j] += dy[i] * hs[t + 1][j];
        }
      }

      const dh = zerosVector(this.hiddenSize);
      for (let j = 0; j < this.hiddenSize; j++) {
        let sum = dhNext[j];
        for (let i = 0; i < this.vocabSize; i++) sum += Why[i][j] * dy[i];
        dh[j] = sum;
      }

      const dhraw = dh.map((v, j) => (1 - hs[t + 1][j] * hs[t + 1][j]) * v);

      for (let i = 0; i < this.hiddenSize; i++) {
        dbh[i] += dhraw[i];
        for (let j = 0; j < this.vocabSize; j++) dWxh[i][j] += dhraw[i] * xs[t][j];
        for (let j = 0; j < this.hiddenSize; j++) dWhh[i][j] += dhraw[i] * hs[t][j];
      }

      const newDhNext = zerosVector(this.hiddenSize);
      for (let j = 0; j < this.hiddenSize; j++) {
        let sum = 0;
        for (let i = 0; i < this.hiddenSize; i++) sum += Whh[i][j] * dhraw[i];
        newDhNext[j] = sum;
      }
      dhNext = newDhNext;
    }

    // corta gradientes para evitar explosão (gradient clipping)
    const clip = (m: number) => Math.max(-5, Math.min(5, m));
    for (const g of [dWxh, dWhh, dWhy]) {
      for (const row of g) for (let i = 0; i < row.length; i++) row[i] = clip(row[i]);
    }
    for (let i = 0; i < dbh.length; i++) dbh[i] = clip(dbh[i]);
    for (let i = 0; i < dby.length; i++) dby[i] = clip(dby[i]);

    this.adagradUpdate(this.params.Wxh, dWxh, this.mem.Wxh, learningRate);
    this.adagradUpdate(this.params.Whh, dWhh, this.mem.Whh, learningRate);
    this.adagradUpdate(this.params.Why, dWhy, this.mem.Why, learningRate);
    this.adagradUpdateVec(this.params.bh, dbh, this.mem.bh, learningRate);
    this.adagradUpdateVec(this.params.by, dby, this.mem.by, learningRate);

    return { loss, hNext: hs[hs.length - 1] };
  }

  private adagradUpdate(param: Matrix, grad: Matrix, mem: Matrix, lr: number) {
    for (let i = 0; i < param.length; i++) {
      for (let j = 0; j < param[i].length; j++) {
        mem[i][j] += grad[i][j] * grad[i][j];
        param[i][j] += (-lr * grad[i][j]) / Math.sqrt(mem[i][j] + 1e-8);
      }
    }
  }

  private adagradUpdateVec(param: Vector, grad: Vector, mem: Vector, lr: number) {
    for (let i = 0; i < param.length; i++) {
      mem[i] += grad[i] * grad[i];
      param[i] += (-lr * grad[i]) / Math.sqrt(mem[i] + 1e-8);
    }
  }

  // Gera uma sequência de índices de caracteres a partir de um estado inicial,
  // amostrando da distribuição de probabilidade prevista a cada passo.
  sample(
    seedIx: number,
    hPrev: Vector,
    length: number,
    temperature = 1
  ): { indices: number[]; h: Vector } {
    let h = hPrev;
    let ix = seedIx;
    const indices: number[] = [];
    for (let t = 0; t < length; t++) {
      const step = this.step(ix, h);
      h = step.h;
      const p = softmax(step.y.map((v) => v / temperature));
      ix = this.sampleFromDist(p);
      indices.push(ix);
    }
    return { indices, h };
  }

  private sampleFromDist(p: Vector): number {
    const r = Math.random();
    let cum = 0;
    for (let i = 0; i < p.length; i++) {
      cum += p[i];
      if (r < cum) return i;
    }
    return p.length - 1;
  }

  toJSON() {
    return { vocabSize: this.vocabSize, hiddenSize: this.hiddenSize, params: this.params };
  }

  static fromJSON(data: { vocabSize: number; hiddenSize: number; params: RNNParams }): CharRNN {
    const rnn = new CharRNN(data.vocabSize, data.hiddenSize);
    rnn.params = data.params;
    return rnn;
  }
}
