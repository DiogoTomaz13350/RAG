export function splitSentences(text: string): string[] {
  const sentences = text
    .split(/\.(?=\s|$)/)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter((sentence) => sentence.length > 0);
  return [...new Set(sentences)];
}
