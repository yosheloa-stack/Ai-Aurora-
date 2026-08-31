// Script de geração: carrega um modelo já treinado (model.json) e gera
// texto novo a partir de um prompt inicial.

import fs from "fs";
import path from "path";
import { CharRNN } from "./rnn";
import { zerosVector } from "./matrix";
import { Vocab } from "./vocab";

const MODEL_PATH = process.argv[2] ?? path.join(__dirname, "..", "model.json");
const PROMPT = process.argv[3] ?? "A";
const LENGTH = Number(process.argv[4]) || 300;
const TEMPERATURE = Number(process.argv[5]) || 0.8;

function main() {
  if (!fs.existsSync(MODEL_PATH)) {
    console.error(
      `Modelo não encontrado em ${MODEL_PATH}. Rode "npm run train" primeiro para treinar a IA.`
    );
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(MODEL_PATH, "utf-8"));
  const rnn = CharRNN.fromJSON(raw);
  const vocab = raw.vocab as Vocab;

  let h = zerosVector(rnn.hiddenSize);
  let output = "";
  let lastIx = 0;

  // "Aquece" o estado oculto processando o prompt, caractere a caractere.
  for (const ch of PROMPT) {
    const ix = vocab.charToIx[ch];
    if (ix === undefined) continue; // ignora caracteres fora do vocabulário aprendido
    output += ch;
    const step = rnn.step(ix, h);
    h = step.h;
    lastIx = ix;
  }

  const { indices } = rnn.sample(lastIx, h, LENGTH, TEMPERATURE);
  output += indices.map((ix) => vocab.ixToChar[ix]).join("");

  console.log(output);
}

main();
