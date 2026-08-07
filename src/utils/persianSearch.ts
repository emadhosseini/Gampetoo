// Generic Persian text search — originally lived inside the food catalog's
// own search module, factored out once the workout library's exercise
// search needed the exact same matching (Arabic-keyboard ی/ك normalized to
// Persian ی/ک, word-prefix rather than raw substring) and there was nothing
// nutrition-specific about either function to justify importing one domain's
// module into an unrelated one just to reuse a string matcher.

export function normalizeFa(value: string): string {
  return value.replace(/ي/g, "ی").replace(/ك/g, "ک").trim().toLowerCase();
}

// Matches only at the start of a word (never mid-word) — e.g. querying "بز"
// must NOT match "قرمه سبزی" (it sits inside "سبزی"), but "سبز" must, since
// it's a prefix of that second word. Leading punctuation (parentheses, etc.)
// around a word is ignored so it doesn't shadow a real word-boundary match.
//
// The query itself can be multiple words too — typing a two/three-word name
// like "پرس سینه هالتر" has to find that exercise. Every query word but the
// last must equal the name's word in the same position (someone typing
// "پرس سینه" has committed to "پرس" being a whole word, not just a prefix of
// it); the last query word only needs to be a prefix, same as the
// single-word case, so results still update as the last word is still being
// typed. The matching run of name-words can start anywhere in the name, not
// just its first word, so "سینه" alone still finds "پرس سینه هالتر".
export function matchesWordPrefix(name: string, query: string): boolean {
  const queryWords = query.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return false;

  const nameWords = name
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+/u, ""));

  const leadingQueryWords = queryWords.slice(0, -1);
  const lastQueryWord = queryWords[queryWords.length - 1];

  for (let start = 0; start + queryWords.length <= nameWords.length; start++) {
    const leadingMatch = leadingQueryWords.every(
      (word, offset) => nameWords[start + offset] === word,
    );
    const lastMatch = nameWords[start + leadingQueryWords.length].startsWith(lastQueryWord);

    if (leadingMatch && lastMatch) return true;
  }

  return false;
}
