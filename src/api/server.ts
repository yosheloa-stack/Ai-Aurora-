// Servidor de chat: expõe POST /chat para o seu bot conversar com a IA.
// O "cérebro" é o roteador de regras (src/api/router.ts) — reconhece a
// intenção da mensagem e usa as ferramentas já prontas (clima, wikipedia,
// youtube, filme, anime, manga, pinterest, busca web). Sem nenhuma API de
// IA externa, paga ou gratuita.

import express from "express";
import { routeMessage } from "./router";

const PORT = Number(process.env.PORT) || 3000;

interface ChatRequestBody {
  message?: string;
}

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const body = req.body as ChatRequestBody;
  const message = body.message?.trim();

  if (!message) {
    res.status(400).json({ error: "Envie 'message' no corpo da requisição." });
    return;
  }

  try {
    const reply = await routeMessage(message);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Servidor de chat rodando em http://localhost:${PORT}`);
});
