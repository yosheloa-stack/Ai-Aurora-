// Motor de conversa: usa a Gemini API (Google) — gratuita, sem cartão de
// crédito no tier free — com tool use (Interactions API), conectada às
// ferramentas já prontas (clima, wikipedia, youtube, filme, anime, manga,
// pinterest, busca web). Personalidade e fatos do grupo em src/api/lore.ts.

import { GoogleGenAI } from "@google/genai";
import * as tokito from "../tokito/tools";
import { braveSearch } from "../brave/client";
import { COMMUNITY_FACTS } from "./lore";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BASE_PERSONALITY = `Você é uma IA que conversa como uma amiga próxima: direta, sem enrolação e
sem respostas genéricas cheias de ressalvas desnecessárias. Vá direto ao
ponto, mas continue sendo clara e correta. Responda em português do Brasil,
no mesmo tom informal que a pessoa usar — inclusive gírias e brincadeiras.

Você sabe de tudo dentro do seu conhecimento geral. Além disso, você tem
ferramentas para buscar informação atualizada quando precisar: clima,
Wikipédia, YouTube, filmes, animes, mangás, Pinterest e busca geral na web.
Use essas ferramentas sempre que a pergunta pedir algo atual, específico ou
que você não tenha certeza — não invente dados que uma ferramenta poderia
confirmar.`;

function buildSystemInstruction(): string {
  if (COMMUNITY_FACTS.length === 0) return BASE_PERSONALITY;
  const facts = COMMUNITY_FACTS.map((f) => `- ${f}`).join("\n");
  return `${BASE_PERSONALITY}\n\nFatos sobre este grupo/comunidade (use quando perguntarem):\n${facts}`;
}

const TOOLS = [
  {
    type: "function" as const,
    name: "get_clima",
    description:
      "Consulta o clima atual (temperatura, condição, umidade, chance de chuva etc.) de uma cidade.",
    parameters: {
      type: "object",
      properties: {
        cidade: { type: "string", description: "Nome da cidade, ex: São Paulo" },
      },
      required: ["cidade"],
    },
  },
  {
    type: "function" as const,
    name: "buscar_wikipedia",
    description: "Busca artigos na Wikipédia em português sobre um termo ou assunto.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "Termo de busca" } },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    name: "buscar_youtube",
    description: "Busca vídeos no YouTube por um termo.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "Termo de busca" } },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    name: "buscar_filme",
    description: "Busca informações sobre filmes (título, ano, elenco, link do IMDb) por um termo.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "Nome do filme" } },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    name: "buscar_anime",
    description: "Busca informações sobre animes (tipo, episódios, nota) no MyAnimeList.",
    parameters: {
      type: "object",
      properties: { q: { type: "string", description: "Nome do anime" } },
      required: ["q"],
    },
  },
  {
    type: "function" as const,
    name: "buscar_manga",
    description: "Busca informações sobre mangás (tipo, volumes, nota) no MyAnimeList.",
    parameters: {
      type: "object",
      properties: { q: { type: "string", description: "Nome do mangá" } },
      required: ["q"],
    },
  },
  {
    type: "function" as const,
    name: "buscar_pinterest",
    description: "Busca imagens no Pinterest por um termo.",
    parameters: {
      type: "object",
      properties: { text: { type: "string", description: "Termo de busca" } },
      required: ["text"],
    },
  },
  {
    type: "function" as const,
    name: "buscar_na_web",
    description:
      "Faz uma busca geral na web para achar informações atuais que as outras ferramentas não cobrem (ex: dicas de Free Fire, notícias, o que for).",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "O que buscar" },
        count: { type: "number", description: "Quantidade de resultados (padrão 5)" },
      },
      required: ["query"],
    },
  },
];

async function executeTool(name: string, args: Record<string, unknown>): Promise<{ result: string; isError: boolean }> {
  try {
    switch (name) {
      case "get_clima":
        return { result: JSON.stringify(await tokito.clima(String(args.cidade))), isError: false };
      case "buscar_wikipedia":
        return { result: JSON.stringify(await tokito.wikipediaSearch(String(args.query))), isError: false };
      case "buscar_youtube":
        return { result: JSON.stringify(await tokito.youtubeSearch(String(args.query))), isError: false };
      case "buscar_filme":
        return { result: JSON.stringify(await tokito.filme(String(args.query))), isError: false };
      case "buscar_anime":
        return { result: JSON.stringify(await tokito.animeSearch(String(args.q))), isError: false };
      case "buscar_manga":
        return { result: JSON.stringify(await tokito.mangaSearch(String(args.q))), isError: false };
      case "buscar_pinterest":
        return { result: JSON.stringify(await tokito.pinterestSearch(String(args.text))), isError: false };
      case "buscar_na_web":
        return {
          result: JSON.stringify(await braveSearch(String(args.query), Number(args.count) || 5)),
          isError: false,
        };
      default:
        return { result: `Ferramenta desconhecida: ${name}`, isError: true };
    }
  } catch (err) {
    return { result: err instanceof Error ? err.message : String(err), isError: true };
  }
}

export interface ConversationResult {
  reply: string;
  interactionId: string;
}

export async function converse(message: string, previousInteractionId?: string): Promise<ConversationResult> {
  // `any` aqui de propósito: os tipos internos da Interactions API (Step,
  // InteractionsInput) não são exportados pelo pacote, então tipar isso
  // com precisão não é possível de fora do SDK.
  let input: any = message;
  let prevId = previousInteractionId;
  let last: any;

  while (true) {
    last = await client.interactions.create(
      {
        model: MODEL,
        system_instruction: buildSystemInstruction(),
        tools: TOOLS,
        ...(prevId ? { previous_interaction_id: prevId } : {}),
        input,
      },
      // Corta a chamada antes do gateway da hospedagem desistir sozinho
      // (evita a requisição ficar pendurada sem resposta nenhuma).
      { timeout: 15000 }
    );

    const functionCalls = last.steps.filter((s: { type: string }) => s.type === "function_call");

    if (functionCalls.length === 0) break;

    const results = [];
    for (const call of functionCalls) {
      const { result, isError } = await executeTool(call.name, call.arguments);
      results.push({
        type: "function_result" as const,
        call_id: call.id,
        name: call.name,
        result,
        is_error: isError,
      });
    }

    prevId = last.id;
    input = results;
  }

  return {
    reply: last.output_text?.trim() || "Não consegui gerar uma resposta agora, tenta de novo?",
    interactionId: last.id,
  };
}
