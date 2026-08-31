# Ai-Aurora — sua própria IA, treinada do zero

Este projeto implementa uma **rede neural recorrente (RNN)** a nível de
caractere, escrita inteiramente em **TypeScript**, sem usar bibliotecas de
machine learning prontas (nada de TensorFlow, PyTorch, etc.). Todo o forward
pass, o backpropagation through time (BPTT) e o otimizador (Adagrad) foram
implementados manualmente, para que você possa ver e entender exatamente
como uma IA aprende.

O modelo aprende a prever o próximo caractere de um texto. Depois de
treinado, ele consegue **gerar texto novo**, caractere a caractere, no
estilo do texto usado no treinamento.

## Como funciona

- `src/matrix.ts` — operações básicas de vetor/matriz (produto matriz-vetor,
  tanh, softmax etc.), a "matemática" por trás da rede.
- `src/rnn.ts` — a classe `CharRNN`: forward pass, backpropagation through
  time, atualização de pesos (Adagrad) e amostragem de texto.
- `src/vocab.ts` — constrói o vocabulário (conjunto de caracteres únicos) a
  partir do corpus de treino.
- `src/train.ts` — script de treino: lê `data/corpus.txt`, treina o modelo e
  salva os pesos em `model.json`.
- `src/generate.ts` — script de geração: carrega `model.json` e gera texto a
  partir de um prompt.
- `data/corpus.txt` — texto de exemplo usado para treinar o modelo. Troque
  por qualquer texto seu para personalizar sua IA.

## Instalação

```bash
npm install
```

## Treinar sua IA

```bash
npm run train
```

Isso treina o modelo sobre `data/corpus.txt` e salva os pesos em
`model.json` na raiz do projeto. Durante o treino, o script imprime a perda
(loss) e uma amostra de texto gerado a cada 500 iterações, para você
acompanhar o aprendizado acontecendo.

Você pode ajustar o número de iterações e usar seu próprio corpus:

```bash
ITERATIONS=50000 npm run train -- data/meu-texto.txt model.json
```

Quanto maior e mais variado o corpus, melhores tendem a ser os resultados —
mas também mais lento o treino, já que esta é uma implementação didática
(CPU, sem paralelismo/GPU).

## Gerar texto com sua IA treinada

```bash
npm run generate -- model.json "Era uma vez" 400 0.8
```

Parâmetros (todos opcionais):

1. Caminho do modelo (padrão: `model.json`)
2. Prompt inicial (padrão: `"A"`)
3. Quantidade de caracteres a gerar (padrão: `300`)
4. Temperatura — controla a aleatoriedade: valores baixos (ex. `0.3`) geram
   texto mais previsível/repetitivo, valores altos (ex. `1.2`) geram texto
   mais criativo/errático (padrão: `0.8`)

## Personalizando sua IA

- Troque o conteúdo de `data/corpus.txt` pelo texto que você quiser que sua
  IA aprenda a "imitar" (respeitando direitos autorais).
- Ajuste `HIDDEN_SIZE`, `SEQ_LENGTH` e `LEARNING_RATE` em `src/train.ts` para
  experimentar modelos maiores/menores ou treinos mais rápidos/lentos.

## Limitações

Este é um projeto educacional para entender os fundamentos de como uma IA é
treinada — não é comparável a modelos de linguagem em larga escala (como o
Claude), que usam arquiteturas muito mais avançadas (Transformers),
bilhões de parâmetros e datasets massivos. Mas os princípios centrais —
uma função com parâmetros ajustáveis, treinada por gradiente descendente
sobre exemplos — são os mesmos.
