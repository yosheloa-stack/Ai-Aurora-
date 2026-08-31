// CLI de busca na internet via Brave Search API.
//
// Uso:
//   BRAVE_API_KEY=sua_chave npm run search -- "sua busca aqui"

import { braveSearch } from "./brave/client";

const QUERY = process.argv[2];
const COUNT = Number(process.argv[3]) || 5;

async function main() {
  if (!QUERY) {
    console.error('Uso: npm run search -- "sua busca aqui" [quantidade]');
    process.exit(1);
  }

  const results = await braveSearch(QUERY, COUNT);

  if (results.length === 0) {
    console.log("Nenhum resultado encontrado.");
    return;
  }

  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.title}`);
    console.log(r.url);
    if (r.description) console.log(r.description);
  });
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
