// Cliente genérico para as Tokito APIs (https://tokito-apis.com.br).
// Lê o token de autenticação da variável de ambiente TOKITO_API_KEY —
// nunca deixe o token escrito diretamente no código.

const BASE_URL = "https://tokito-apis.com.br/api";

export class TokitoApiError extends Error {}

export async function tokitoRequest<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const apiKey = process.env.TOKITO_API_KEY;
  if (!apiKey) {
    throw new TokitoApiError(
      "Defina a variável de ambiente TOKITO_API_KEY com seu token da Tokito APIs."
    );
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url);
  const data = (await response.json()) as { status?: boolean; message?: string; resultado?: unknown };

  if (!response.ok || data.status === false) {
    const reason = data.message ?? (typeof data.resultado === "string" ? data.resultado : undefined);
    throw new TokitoApiError(`Tokito API (${endpoint}) falhou: ${reason ?? response.statusText}`);
  }

  return data as T;
}
