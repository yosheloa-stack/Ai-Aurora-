// Servidor de chat: expõe POST /chat para o seu bot conversar com uma IA
// de verdade (Claude), com personalidade direta/informal e acesso às
// ferramentas (clima, wikipedia, youtube, filme, anime, manga, pinterest,
// busca web) quando a conversa pedir.
//
// Requer ANTHROPIC_API_KEY. As ferramentas usam TOKITO_API_KEY e
// BRAVE_API_KEY quando chamadas — se não estiverem definidas, a IA recebe
// o erro daquela ferramenta específica e pode explicar isso ao usuário,
// sem derrubar o servidor.

import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { TOOLS, executeTool } from "./agent";

const PORT = Number(process.env.PORT) || 3000;
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";
const MAX_HISTORY_MESSAGES = 20;

const client = new Anthropic();

const SYSTEM_PROMPT = `Você é uma IA que conversa como uma amiga próxima: direta, sem enrolação e
sem respostas genéricas cheias de ressalvas desnecessárias. Vá direto ao
ponto, mas continue sendo clara e correta. Responda em português do Brasil,
no mesmo tom informal que a pessoa usar.

Você sabe de tudo dentro do seu conhecimento geral. Além disso, você tem
ferramentas para buscar informação atualizada quando precisar: clima,
Wikipédia, YouTube, filmes, animes, mangás, Pinterest e busca geral na web.
Use essas ferramentas sempre que a pergunta pedir algo atual, específico ou
que você não tenha certeza — não invente dados que uma ferramenta poderia
confirmar.`;

interface ChatRequestBody {
  userId?: string;
  message?: string;
}

const conversations = new Map<string, Anthropic.MessageParam[]>();

function getHistory(userId: string): Anthropic.MessageParam[] {
  return conversations.get(userId) ?? [];
}

function saveHistory(userId: string, history: Anthropic.MessageParam[]) {
  conversations.set(userId, history.slice(-MAX_HISTORY_MESSAGES));
}

async function runConversation(
  history: Anthropic.MessageParam[]
): Promise<{ history: Anthropic.MessageParam[]; finalResponse: Anthropic.Message }> {
  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      output_config: { effort: "medium" },
      messages: history,
    });

    history.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const result = await executeTool(block.name, block.input);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result.content,
          is_error: result.isError,
        });
      }

      history.push({ role: "user", content: toolResults });
      continue;
    }

    if (response.stop_reason === "pause_turn") {
      continue;
    }

    return { history, finalResponse: response };
  }
}

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const body = req.body as ChatRequestBody;
  const userId = body.userId?.trim();
  const message = body.message?.trim();

  if (!userId || !message) {
    res.status(400).json({ error: "Envie 'userId' e 'message' no corpo da requisição." });
    return;
  }

  try {
    const history: Anthropic.MessageParam[] = [...getHistory(userId), { role: "user", content: message }];

    const { history: updated, finalResponse } = await runConversation(history);
    saveHistory(userId, updated);

    const reply = finalResponse.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    res.json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Chave da Anthropic API inválida ou ausente.");
      res.status(500).json({ error: "Erro de configuração do servidor (API key)." });
    } else if (err instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: "Limite de requisições atingido, tente novamente em instantes." });
    } else if (err instanceof Anthropic.APIError) {
      console.error("Erro da API da Anthropic:", err.message);
      res.status(502).json({ error: "Erro ao consultar a IA." });
    } else {
      console.error(err);
      res.status(500).json({ error: "Erro interno." });
    }
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Servidor de chat rodando em http://localhost:${PORT}`);
});
