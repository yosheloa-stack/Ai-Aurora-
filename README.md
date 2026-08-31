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

Uma IA que de fato **raciocine sobre os resultados** (não só liste links)
usa um LLM real com tool use — é o que o servidor de chat abaixo faz.

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

## Servidor de chat para o seu bot (IA de regras, sem API paga)

Um servidor (`src/api/server.ts`) que expõe `POST /chat`. O "cérebro" é o
roteador de regras em `src/api/router.ts`: reconhece a intenção da
mensagem (saudação, clima, busca de filme/anime/mangá/vídeo/imagem, busca
geral, etc.) e usa as ferramentas já prontas — sem depender de nenhuma API
de IA externa, paga ou gratuita.

Isso é mais limitado que um LLM: ele reconhece **padrões** fixos na frase,
não interpreta perguntas livres com conhecimento geral. Fora dos padrões
reconhecidos, ele responde com uma mensagem de fallback pedindo para
reformular.

### Configuração

Copie `.env.example` para `.env` e preencha `BRAVE_API_KEY` e
`TOKITO_API_KEY` (usadas pelas ferramentas — se faltar alguma, só aquela
ferramenta específica retorna erro, sem derrubar o servidor).

Rode local:

```bash
npm run server
```

### Integrando com o seu bot

Seu bot chama o endpoint por HTTP, passando a mensagem do usuário:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "qual o clima em São Paulo agora?"}'
```

Resposta:

```json
{ "reply": "São Paulo, São Paulo - Brasil\nCondição: Nublado\nTemperatura: 17.6°C..." }
```

### Deploy na Square Cloud

O projeto já vem com `squarecloud.app` configurado (`MAIN=src/api/server.ts`,
`MEMORY=512`, `SUBDOMAIN=ai-aurora`) — a Square Cloud roda TypeScript
nativamente (via `tsx`), sem precisar de build manual.

1. Troque `SUBDOMAIN` no `squarecloud.app` se `ai-aurora` já estiver em uso
   por outra pessoa na plataforma.
2. Compacte o projeto em `.zip` **sem** `node_modules`, `.git`, `.env`,
   `dist` e `model.json`.
3. No [dashboard da Square Cloud](https://squarecloud.app/pt-br/dashboard/new),
   faça upload do zip (ou use a CLI: `npm i -g @squarecloud/cli`,
   `squarecloud auth login`, `squarecloud upload`).
4. No painel da aplicação, configure as variáveis de ambiente
   `BRAVE_API_KEY` e `TOKITO_API_KEY`.
5. Depois do deploy, sua API fica em `https://ai-aurora.squareweb.app/chat`
   (ou o subdomínio que você escolheu) — é essa URL que seu bot vai chamar.

## Limitações

A RNN (`src/rnn.ts`) e o roteador de regras (`src/api/router.ts`) são as
duas partes "próprias" deste projeto — nenhuma das duas é um modelo de
linguagem real. A RNN gera texto por estilo, sem entender perguntas; o
roteador reconhece padrões fixos nas mensagens. Nenhum dos dois "sabe de
tudo" como um LLM (Claude, GPT etc.) — isso exigiria bilhões de parâmetros
e datasets massivos, fora do escopo de um projeto pessoal.
