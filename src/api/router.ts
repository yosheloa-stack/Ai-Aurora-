// Roteador de intenções: reconhece padrões comuns na mensagem do usuário e
// decide qual ferramenta chamar (ou qual resposta pronta usar). Essa é a
// "IA" do bot — baseada em regras, sem nenhum modelo de linguagem externo,
// 100% própria e gratuita.

import * as tokito from "../tokito/tools";
import { braveSearch } from "../brave/client";

function clean(text: string): string {
  return text
    .replace(/\b(por favor|pfv|please|agora|hoje|pra mim|na internet|na web)\b/gi, "")
    .trim()
    .replace(/[?!.]+$/g, "")
    .trim();
}

const GREETINGS = ["oi", "olá", "ola", "eae", "e ai", "e aí", "bom dia", "boa tarde", "boa noite", "salve"];
const FAREWELLS = ["tchau", "até mais", "ate mais", "até logo", "flw", "falou"];
const THANKS = ["obrigado", "obrigada", "valeu", "vlw"];

function formatList<T>(items: T[], format: (item: T) => string, emptyMessage: string): string {
  if (items.length === 0) return emptyMessage;
  return items
    .slice(0, 5)
    .map((item, i) => `${i + 1}. ${format(item)}`)
    .join("\n\n");
}

function errorMessage(err: unknown, action: string): string {
  const detail = err instanceof Error ? err.message : String(err);
  return `Deu erro tentando ${action}: ${detail}`;
}

export async function routeMessage(message: string): Promise<string> {
  const text = message.toLowerCase().trim();

  if (GREETINGS.some((g) => text.startsWith(g))) {
    return "Oi! Posso te ajudar com clima, busca na Wikipédia, YouTube, filmes, animes, mangás, Pinterest ou busca geral na web. Manda a pergunta.";
  }

  if (FAREWELLS.some((f) => text.includes(f))) {
    return "Falou! Qualquer coisa é só chamar.";
  }

  if (THANKS.some((t) => text.includes(t))) {
    return "De nada!";
  }

  if (/\bquem (é|e) voc[eê]|seu nome|voc[eê] (é|e) (uma ia|um bot|rob[oô])/i.test(text)) {
    return "Sou uma IA própria, feita do zero pra esse bot — respondo direto, sem enrolação, e sei buscar clima, Wikipédia, YouTube, filmes, animes, mangás, Pinterest e a web em geral.";
  }

  let match: RegExpMatchArray | null;

  match = text.match(/(?:clima|tempo|previs[aã]o)(?:\s+(?:em|de|para|pra))?\s+(.+)/i);
  if (match) {
    const cidade = clean(match[1]);
    try {
      const r = await tokito.clima(cidade);
      return (
        `${r.cidade}, ${r.estado} - ${r.pais}\n` +
        `Condição: ${r.condicao}\n` +
        `Temperatura: ${r.temperatura} (sensação: ${r.sensacao_termica})\n` +
        `Máxima/Mínima: ${r.maxima} / ${r.minima}\n` +
        `Umidade: ${r.umidade} | Vento: ${r.vento} | Chance de chuva: ${r.chance_de_chuva}`
      );
    } catch (err) {
      return errorMessage(err, "buscar o clima");
    }
  }

  match = text.match(/(.+?)\s+no youtube/i) ?? text.match(/v[ií]deo(?:s)?\s+(?:de|sobre)?\s*(.+)/i);
  if (match) {
    const query = clean(match[1]);
    try {
      const results = await tokito.youtubeSearch(query);
      return formatList(results, (r) => `${r.title}\n${r.url}`, `Não achei vídeos sobre "${query}".`);
    } catch (err) {
      return errorMessage(err, "buscar no YouTube");
    }
  }

  match = text.match(/\bfilme\s+(.+)/i);
  if (match) {
    const query = clean(match[1]);
    try {
      const results = await tokito.filme(query);
      return formatList(results, (r) => `${r.titulo} (${r.ano})\n${r.link}`, `Não achei filmes sobre "${query}".`);
    } catch (err) {
      return errorMessage(err, "buscar o filme");
    }
  }

  match = text.match(/\banime\s+(.+)/i);
  if (match) {
    const query = clean(match[1]);
    try {
      const results = await tokito.animeSearch(query);
      return formatList(results, (r) => `${r.titulo} - nota ${r.nota}\n${r.url}`, `Não achei animes sobre "${query}".`);
    } catch (err) {
      return errorMessage(err, "buscar o anime");
    }
  }

  match = text.match(/\bmang[áa]\s+(.+)/i);
  if (match) {
    const query = clean(match[1]);
    try {
      const results = await tokito.mangaSearch(query);
      return formatList(results, (r) => `${r.titulo} - nota ${r.nota}\n${r.link}`, `Não achei mangás sobre "${query}".`);
    } catch (err) {
      return errorMessage(err, "buscar o mangá");
    }
  }

  match = text.match(/\b(?:imagem|imagens|foto|fotos)\s+de\s+(.+)/i);
  if (match) {
    const query = clean(match[1]);
    try {
      const results = await tokito.pinterestSearch(query);
      return formatList(results, (r) => r.url, `Não achei imagens de "${query}".`);
    } catch (err) {
      return errorMessage(err, "buscar imagens");
    }
  }

  match = text.match(/\b(?:o que (?:é|e)|quem (?:foi|é|e))\s+(.+)/i);
  if (match) {
    const query = clean(match[1]);
    try {
      const results = await tokito.wikipediaSearch(query);
      if (results.length === 0) return `Não achei nada sobre "${query}" na Wikipédia.`;
      const r = results[0];
      return `${r.titulo}: ${r.snippet}\n${r.url}`;
    } catch (err) {
      return errorMessage(err, "buscar na Wikipédia");
    }
  }

  match = text.match(/\b(?:pesquisa|busca|procura)(?:r)?\s+(?:sobre\s+)?(.+)/i);
  if (match) {
    const query = clean(match[1]);
    try {
      const results = await braveSearch(query, 5);
      return formatList(results, (r) => `${r.title}\n${r.url}`, `Não achei nada sobre "${query}".`);
    } catch (err) {
      return errorMessage(err, "buscar na web");
    }
  }

  return "Não entendi bem. Pergunta sobre clima, um filme, anime, mangá, um vídeo, uma imagem, ou peça pra eu pesquisar algo — que eu te ajudo.";
}
