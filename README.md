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

## Buscar na internet

A RNN em si **não tem e não pode ter** acesso à internet — ela só aprende a
imitar o texto de treino, não a buscar informação nova. Por isso, a busca na
web é um script separado (`src/search.ts`) que consulta a
[Brave Search API](https://brave.com/search/api/) (tem free tier, 2.000
buscas/mês) e imprime os resultados brutos (título, link e resumo) — sem a
IA interpretar ou usar esses resultados.

1. Crie uma conta gratuita e gere uma chave em https://brave.com/search/api/
2. Rode:

```bash
BRAVE_API_KEY=sua_chave npm run search -- "sua busca aqui" 5
```

O segundo argumento (opcional, padrão `5`) é o número de resultados.

Se você quiser uma IA que de fato **raciocine sobre os resultados da busca**
e responda perguntas com eles (não só liste links), isso exige um modelo de
linguagem real com tool use — algo além do escopo desta RNN de brinquedo.
Me avise se quiser seguir por esse caminho.

## Outras ferramentas (Tokito APIs)

Além da busca web, há uma CLI com sete ferramentas que consultam a
[Tokito APIs](https://tokito-apis.com.br): clima, busca na Wikipédia, busca
no YouTube, filmes, animes, mangás e Pinterest. Assim como a busca web, são
scripts independentes — não são interpretados pela RNN.

Defina seu token como variável de ambiente (**nunca** o coloque direto no
código ou em arquivos versionados):

```bash
export TOKITO_API_KEY=seu_token
```

Uso:

```bash
npm run tools -- clima "São Paulo"
npm run tools -- wikipedia "Inteligência artificial"
npm run tools -- youtube "lofi"
npm run tools -- filme "matrix"
npm run tools -- anime "naruto"
npm run tools -- manga "naruto"
npm run tools -- pinterest "gatos"
```

## Limitações

Este é um projeto educacional para entender os fundamentos de como uma IA é
treinada — não é comparável a modelos de linguagem em larga escala (como o
Claude), que usam arquiteturas muito mais avançadas (Transformers),
bilhões de parâmetros e datasets massivos. Mas os princípios centrais —
uma função com parâmetros ajustáveis, treinada por gradiente descendente
sobre exemplos — são os mesmos.
