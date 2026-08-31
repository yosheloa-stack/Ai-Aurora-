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

## Servidor de chat para o seu bot (Claude + ferramentas)

Este é o motor real para "conversar normal, com respostas diretas, sabendo
de tudo": um servidor (`src/api/server.ts`) que expõe `POST /chat` e usa a
API da Claude (Anthropic) com tool use. A IA decide sozinha, durante a
conversa, quando chamar clima, Wikipédia, YouTube, filme, anime, mangá,
Pinterest ou busca web — e responde com um tom direto e informal (definido
no system prompt do arquivo).

### Configuração

Copie `.env.example` para `.env` e preencha:

- `ANTHROPIC_API_KEY` — obrigatória. Gere em https://console.anthropic.com
- `BRAVE_API_KEY` e `TOKITO_API_KEY` — necessárias só para as ferramentas
  que as usam; se faltar alguma, a IA recebe o erro daquela ferramenta
  específica e pode explicar isso na resposta, sem derrubar o servidor.
- `CLAUDE_MODEL` — opcional, padrão `claude-opus-5`. Pode trocar por um
  modelo mais barato (ex. `claude-sonnet-5`) se o custo/latência importar
  mais que a qualidade máxima.

Rode:

```bash
npm run server
```

### Integrando com o seu bot

Seu bot chama o endpoint por HTTP, passando um `userId` (o ID do usuário/chat
na sua plataforma) e a mensagem:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "12345", "message": "qual o clima em São Paulo agora?"}'
```

Resposta:

```json
{ "reply": "Tá parcialmente nublado aí, 17.6°C, sensação de 18.3°C, 75% de chance de chuva. Leva um casaco." }
```

O histórico da conversa de cada `userId` fica em memória no processo do
servidor (últimas 20 mensagens) — reinicia se o servidor reiniciar. Para
produção com múltiplas instâncias ou persistência entre reinícios, isso
precisaria de um armazenamento externo (Redis, banco de dados etc.), o que
está fora do escopo deste projeto por enquanto.

## Limitações

A RNN (`src/rnn.ts`) é um projeto educacional para entender os fundamentos
de como uma IA é treinada do zero — não é comparável a modelos de linguagem
em larga escala. O servidor de chat (`src/api/server.ts`), por outro lado,
usa um LLM real (Claude) e é o que realmente serve para conversar com
usuários e responder de forma abrangente.
