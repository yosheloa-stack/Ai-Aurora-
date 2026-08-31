// Script de busca na internet: consulta a Brave Search API e imprime os
// resultados brutos (título, link e resumo). Independente da RNN — este
// script não usa nem interpreta os resultados com a IA, apenas os traz.
//
// Requer uma chave de API gratuita da Brave Search:
// https://brave.com/search/api/
//
// Uso:
//   BRAVE_API_KEY=sua_chave npm run search -- "sua busca aqui"

const API_KEY = process.env.BRAVE_API_KEY;
const QUERY = process.argv[2];
const COUNT = Number(process.argv[3]) || 5;

interface BraveWebResult {
  title: string;
  url: string;
  description?: string;
}

interface BraveSearchResponse {
  web?: {
    results?: BraveWebResult[];
  };
}

async function search(query: string, count: number): Promise<BraveWebResult[]> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(count));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`Busca falhou: ${response.status} ${response.statusText} — ${await response.text()}`);
  }

  const data = (await response.json()) as BraveSearchResponse;
  return data.web?.results ?? [];
}

async function main() {
  if (!API_KEY) {
    console.error(
      "Defina a variável de ambiente BRAVE_API_KEY com sua chave da Brave Search API.\n" +
        "Obtenha uma gratuitamente em: https://brave.com/search/api/"
    );
    process.exit(1);
  }

  if (!QUERY) {
    console.error('Uso: npm run search -- "sua busca aqui" [quantidade]');
    process.exit(1);
  }

  const results = await search(QUERY, COUNT);

  if (results.length === 0) {
    console.log("Nenhum resultado encontrado.");
    return;
  }

  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.title}`);
    console.log(r.url);
    if (r.description) console.log(r.description.replace(/<[^>]+>/g, ""));
  });
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
