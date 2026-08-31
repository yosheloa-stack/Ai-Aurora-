// Servidor de chat: expõe POST /chat para o seu bot conversar com a IA.
// O "cérebro" é o motor Gemini (src/api/gemini.ts) — entende qualquer
// jeito de perguntar (não só padrões fixos) e usa as ferramentas prontas
// (clima, wikipedia, youtube, filme, anime, manga, pinterest, busca web)
// quando precisar. Gratuito, sem cartão de crédito, no tier free da
// Gemini API.

import express from "express";
import { converse } from "./gemini";

const PORT = Number(process.env.PORT) || 3000;

interface ChatRequestBody {
  userId?: string;
  message?: string;
}

// Guarda o ID da última interação de cada usuário — é assim que a Gemini
// API mantém o contexto da conversa entre requisições (server-side).
const lastInteractionByUser = new Map<string, string>();

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
    const previousInteractionId = lastInteractionByUser.get(userId);
    const { reply, interactionId } = await converse(message, previousInteractionId);
    lastInteractionByUser.set(userId, interactionId);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno ao consultar a IA." });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Servidor de chat rodando em http://localhost:${PORT}`);
});
