export function parseProviderJsonObject(text, missingObjectMessage) {
    return JSON.parse(extractProviderJsonObject(text, missingObjectMessage));
}
export function extractProviderJsonObject(text, missingObjectMessage) {
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
