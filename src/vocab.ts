// Constrói o vocabulário (conjunto de caracteres únicos) de um texto,
// necessário para transformar caracteres em números que a rede entende.

export interface Vocab {
  chars: string[];
  charToIx: Record<string, number>;
  ixToChar: Record<number, string>;
}

export function buildVocab(text: string): Vocab {
  const chars = Array.from(new Set(text.split(""))).sort();
  const charToIx: Record<string, number> = {};
  const ixToChar: Record<number, string> = {};
  chars.forEach((c, i) => {
    charToIx[c] = i;
    ixToChar[i] = c;
  });
  return { chars, charToIx, ixToChar };
}
