/**
 * Convertit un texte avec formatage Markdown simple en HTML
 * Supporte uniquement **gras** et *italique*
 */
export function parseSimpleMarkdown(text: string): string {
  if (!text) return ''

  return text
    // Remplacer **texte** par <strong>texte</strong> (gras)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Remplacer *texte* par <em>texte</em> (italique)
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Remplacer les sauts de ligne par <br />
    .replace(/\n/g, '<br />')
}

/**
 * Composant React pour afficher du texte avec formatage Markdown simple
 * Usage: <FormattedText text={product.description} />
 */
export function FormattedText({ text, className = '' }: { text?: string; className?: string }) {
  if (!text) return null

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(text) }}
    />
  )
}
