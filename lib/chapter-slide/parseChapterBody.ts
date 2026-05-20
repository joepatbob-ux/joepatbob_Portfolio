/** Split chapter body on blank lines into display paragraphs. */
export function parseChapterBody(body: string): string[] {
  return body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}
