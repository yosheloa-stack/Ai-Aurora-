// Cliente reutilizável para a Brave Search API. Lê o token de
// BRAVE_API_KEY. Usado tanto pela CLI (src/search.ts) quanto pelo
// servidor de chat (src/api/server.ts) como ferramenta da IA.

export interface BraveWebResult {
  title: string;
  url: string;
  description?: string;
}

interface BraveSearchResponse {
  web?: {
    results?: BraveWebResult[];
  };
}

export async function braveSearch(query: string, count = 5): Promise<BraveWebResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Defina a variável de ambiente BRAVE_API_KEY com sua chave da Brave Search API (https://brave.com/search/api/)."
    );
  }

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(count));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Busca falhou: ${response.status} ${response.statusText} — ${await response.text()}`);
  }

  const data = (await response.json()) as BraveSearchResponse;
  return (data.web?.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    description: r.description?.replace(/<[^>]+>/g, ""),
  }));
}
