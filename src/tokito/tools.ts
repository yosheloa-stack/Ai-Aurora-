// Uma função por endpoint da Tokito APIs, cada uma tipada com o formato de
// resposta observado na API.

import { tokitoRequest } from "./client";

export interface Clima {
  cidade: string;
  estado: string;
  pais: string;
  temperatura: string;
  sensacao_termica: string;
  umidade: string;
  vento: string;
  condicao: string;
  chance_de_chuva: string;
  maxima: string;
  minima: string;
}

export async function clima(cidade: string): Promise<Clima> {
  const data = await tokitoRequest<{ resultado: Clima }>("clima", { cidade });
  return data.resultado;
}

export interface WikipediaResult {
  titulo: string;
  snippet: string;
  url: string;
}

export async function wikipediaSearch(query: string): Promise<WikipediaResult[]> {
  const data = await tokitoRequest<{ resultado: WikipediaResult[] }>("wikipedia-search", { query });
  return data.resultado;
}

export interface YoutubeResult {
  title: string;
  url: string;
  author?: { name: string };
  views?: string;
}

export async function youtubeSearch(query: string): Promise<YoutubeResult[]> {
  const data = await tokitoRequest<{ resultado: YoutubeResult[] }>("youtube-search", { query });
  return data.resultado;
}

export interface FilmeResult {
  titulo: string;
  ano: number;
  elenco: string;
  link: string;
}

export async function filme(query: string): Promise<FilmeResult[]> {
  const data = await tokitoRequest<{ resultado: FilmeResult[] }>("filme", { query });
  return data.resultado;
}

export interface AnimeResult {
  titulo: string;
  tipo: string;
  episodios: string;
  nota: string;
  url: string;
}

export async function animeSearch(q: string): Promise<AnimeResult[]> {
  const data = await tokitoRequest<{ resultado: AnimeResult[] }>("anime-search", { q });
  return data.resultado;
}

export interface MangaResult {
  titulo: string;
  tipo: string;
  volumes: string;
  nota: string;
  link: string;
}

export async function mangaSearch(q: string): Promise<MangaResult[]> {
  const data = await tokitoRequest<{ resultado: MangaResult[] }>("manga-search", { q });
  return data.resultado;
}

export interface PinterestResult {
  titulo: string;
  url: string;
}

export async function pinterestSearch(text: string): Promise<PinterestResult[]> {
  const data = await tokitoRequest<{ resultado: PinterestResult[] }>("pinterest-search", { text });
  return data.resultado;
}
