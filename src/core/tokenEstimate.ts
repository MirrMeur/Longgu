const cjkPattern = /[\u3400-\u9fff\uf900-\ufaff]/;
const structuralPattern = /[{}\[\]":,`#*_|\-]/;

export function estimateTokens(text: string): number {
  if (text.trim() === "") {
    return 0;
  }

  let cjk = 0;
  let ascii = 0;
  let structural = 0;
  let whitespace = 0;
  let other = 0;

  for (const char of text) {
    if (cjkPattern.test(char)) {
      cjk += 1;
    } else if (structuralPattern.test(char)) {
      structural += 1;
    } else if (/\s/.test(char)) {
      whitespace += 1;
    } else if (char.charCodeAt(0) <= 0x7f) {
      ascii += 1;
    } else {
      other += 1;
    }
  }

  return Math.max(1, Math.ceil(cjk + ascii / 2 + structural + whitespace / 12 + other));
}
