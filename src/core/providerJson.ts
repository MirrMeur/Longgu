export function parseProviderJsonObject(text: string, missingObjectMessage: string): unknown {
  return JSON.parse(extractProviderJsonObject(text, missingObjectMessage)) as unknown;
}

export function extractProviderJsonObject(text: string, missingObjectMessage: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1];
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error(missingObjectMessage);
  }
  return trimmed.slice(first, last + 1);
}
