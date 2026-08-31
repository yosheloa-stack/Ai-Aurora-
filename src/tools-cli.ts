// CLI unificada para as ferramentas da Tokito APIs (clima, wikipedia,
// youtube, filmes, animes, mangás, pinterest). Assim como o search.ts, é
// independente da RNN: apenas busca e imprime os dados brutos.
//
// Lê TOKITO_API_KEY do arquivo .env automaticamente.
//
// Uso:
//   npm run tools -- clima "São Paulo"
//   npm run tools -- wikipedia "Brasil"

import "dotenv/config";
import * as tokito from "./tokito/tools";

const USAGE = `Uso: npm run tools -- <ferramenta> "<consulta>"

Ferramentas disponíveis:
  clima       <cidade>
  wikipedia   <termo>
  youtube     <termo>
  filme       <termo>
  anime       <termo>
  manga       <termo>
  pinterest   <termo>
`;

async function main() {
  const [, , toolName, ...rest] = process.argv;
  const query = rest.join(" ");

  if (!toolName || !query) {
    console.log(USAGE);
    process.exit(toolName ? 1 : 0);
  }

  switch (toolName) {
    case "clima": {
      const r = await tokito.clima(query);
      console.log(`${r.cidade}, ${r.estado} - ${r.pais}`);
      console.log(`Condição: ${r.condicao}`);
      console.log(`Temperatura: ${r.temperatura} (sensação: ${r.sensacao_termica})`);
      console.log(`Máxima/Mínima: ${r.maxima} / ${r.minima}`);
      console.log(`Umidade: ${r.umidade} | Vento: ${r.vento} | Chance de chuva: ${r.chance_de_chuva}`);
      break;
    }
    case "wikipedia": {
      const results = await tokito.wikipediaSearch(query);
      results.forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.titulo}`);
        console.log(r.snippet);
        console.log(r.url);
      });
      break;
    }
    case "youtube": {
      const results = await tokito.youtubeSearch(query);
      results.forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.title}`);
        console.log(`${r.author?.name ?? ""}${r.views ? " - " + r.views : ""}`);
        console.log(r.url);
      });
      break;
    }
    case "filme": {
      const results = await tokito.filme(query);
      results.forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.titulo} (${r.ano})`);
        console.log(`Elenco: ${r.elenco}`);
        console.log(r.link);
      });
      break;
    }
    case "anime": {
      const results = await tokito.animeSearch(query);
      results.forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.titulo} - ${r.tipo} (${r.episodios} ep.) - nota ${r.nota}`);
        console.log(r.url);
      });
      break;
    }
    case "manga": {
      const results = await tokito.mangaSearch(query);
      results.forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.titulo} - ${r.tipo} (${r.volumes} vol.) - nota ${r.nota}`);
        console.log(r.link);
      });
      break;
    }
    case "pinterest": {
      const results = await tokito.pinterestSearch(query);
      results.forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.titulo}`);
        console.log(r.url);
      });
      break;
    }
    default:
      console.error(`Ferramenta desconhecida: ${toolName}`);
      console.log(USAGE);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
