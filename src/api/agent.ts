// Definições das ferramentas (tool use) que a IA pode chamar durante a
// conversa, e o dispatcher que executa cada uma.

import Anthropic from "@anthropic-ai/sdk";
import * as tokito from "../tokito/tools";
import { braveSearch } from "../brave/client";

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_clima",
    description:
      "Consulta o clima atual (temperatura, condição, umidade, chance de chuva etc.) de uma cidade.",
    input_schema: {
      type: "object",
      properties: {
        cidade: { type: "string", description: "Nome da cidade, ex: São Paulo" },
      },
      required: ["cidade"],
    },
  },
  {
    name: "buscar_wikipedia",
    description: "Busca artigos na Wikipédia em português sobre um termo ou assunto.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Termo de busca" } },
      required: ["query"],
    },
  },
  {
    name: "buscar_youtube",
    description: "Busca vídeos no YouTube por um termo.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Termo de busca" } },
      required: ["query"],
    },
  },
  {
    name: "buscar_filme",
    description: "Busca informações sobre filmes (título, ano, elenco, link do IMDb) por um termo.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Nome do filme" } },
      required: ["query"],
    },
  },
  {
    name: "buscar_anime",
    description: "Busca informações sobre animes (tipo, episódios, nota) no MyAnimeList.",
    input_schema: {
      type: "object",
      properties: { q: { type: "string", description: "Nome do anime" } },
      required: ["q"],
    },
  },
  {
    name: "buscar_manga",
    description: "Busca informações sobre mangás (tipo, volumes, nota) no MyAnimeList.",
    input_schema: {
      type: "object",
      properties: { q: { type: "string", description: "Nome do mangá" } },
      required: ["q"],
    },
  },
  {
    name: "buscar_pinterest",
    description: "Busca imagens no Pinterest por um termo.",
    input_schema: {
      type: "object",
      properties: { text: { type: "string", description: "Termo de busca" } },
      required: ["text"],
    },
  },
  {
    name: "buscar_na_web",
    description:
      "Faz uma busca geral na web para achar informações atuais que as outras ferramentas não cobrem.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "O que buscar" },
        count: { type: "number", description: "Quantidade de resultados (padrão 5)" },
      },
      required: ["query"],
    },
  },
];

export interface ToolExecutionResult {
  content: string;
  isError: boolean;
}

export async function executeTool(name: string, rawInput: unknown): Promise<ToolExecutionResult> {
  const input = (rawInput ?? {}) as Record<string, unknown>;
  try {
    switch (name) {
      case "get_clima":
        return ok(await tokito.clima(String(input.cidade)));
      case "buscar_wikipedia":
        return ok(await tokito.wikipediaSearch(String(input.query)));
      case "buscar_youtube":
        return ok(await tokito.youtubeSearch(String(input.query)));
      case "buscar_filme":
        return ok(await tokito.filme(String(input.query)));
      case "buscar_anime":
        return ok(await tokito.animeSearch(String(input.q)));
      case "buscar_manga":
        return ok(await tokito.mangaSearch(String(input.q)));
      case "buscar_pinterest":
        return ok(await tokito.pinterestSearch(String(input.text)));
      case "buscar_na_web":
        return ok(await braveSearch(String(input.query), Number(input.count) || 5));
      default:
        return { content: `Ferramenta desconhecida: ${name}`, isError: true };
    }
  } catch (err) {
    return { content: err instanceof Error ? err.message : String(err), isError: true };
  }
}

function ok(value: unknown): ToolExecutionResult {
  return { content: JSON.stringify(value), isError: false };
}
