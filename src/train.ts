// Script de treino: lê um corpus de texto, treina a RNN caractere a
// caractere e salva os pesos aprendidos em model.json.

import fs from "fs";
import path from "path";
import { CharRNN } from "./rnn";
import { buildVocab } from "./vocab";
import { zerosVector } from "./matrix";

const DATA_PATH = process.argv[2] ?? path.join(__dirname, "..", "data", "corpus.txt");
const MODEL_PATH = process.argv[3] ?? path.join(__dirname, "..", "model.json");

const HIDDEN_SIZE = 100;
const SEQ_LENGTH = 25;
const LEARNING_RATE = 0.1;
const ITERATIONS = Number(process.env.ITERATIONS) || 20000;
const SAMPLE_EVERY = 500;

function main() {
  const text = fs.readFileSync(DATA_PATH, "utf-8");
  if (text.length < SEQ_LENGTH + 1) {
    throw new Error("O corpus é pequeno demais para treinar. Adicione mais texto em data/corpus.txt.");
  }

  const vocab = buildVocab(text);
  console.log(`Corpus: ${text.length} caracteres, vocabulário: ${vocab.chars.length} símbolos.`);
  console.log(`Treinando por ${ITERATIONS} iterações (defina ITERATIONS=N para mudar)...`);

  const rnn = new CharRNN(vocab.chars.length, HIDDEN_SIZE);

  let pointer = 0;
  let hPrev = zerosVector(HIDDEN_SIZE);
  let smoothLoss = -Math.log(1 / vocab.chars.length) * SEQ_LENGTH;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    if (pointer + SEQ_LENGTH + 1 >= text.length || iter === 0) {
      hPrev = zerosVector(HIDDEN_SIZE);
      pointer = 0;
    }

    const inputs = text
      .slice(pointer, pointer + SEQ_LENGTH)
      .split("")
      .map((c) => vocab.charToIx[c]);
    const targets = text
      .slice(pointer + 1, pointer + SEQ_LENGTH + 1)
      .split("")
      .map((c) => vocab.charToIx[c]);

    const { loss, hNext } = rnn.lossAndGrad(inputs, targets, hPrev, LEARNING_RATE);
    hPrev = hNext;
    smoothLoss = smoothLoss * 0.999 + loss * 0.001;

    if (iter % SAMPLE_EVERY === 0) {
      const { indices } = rnn.sample(inputs[0], hPrev, 200);
      const sampleText = indices.map((ix) => vocab.ixToChar[ix]).join("");
      console.log(`\n--- iteração ${iter} | loss suavizado: ${smoothLoss.toFixed(3)} ---`);
      console.log(sampleText);
    }

    pointer += SEQ_LENGTH;
  }

  fs.writeFileSync(MODEL_PATH, JSON.stringify({ ...rnn.toJSON(), vocab }));
  console.log(`\nTreino concluído. Modelo salvo em: ${MODEL_PATH}`);
}

main();
