/**
 * Der Schichtaufbau – so weit er ohne Oberfläche zu beschreiben ist.
 *
 * Verbrauch und Gesamtmenge rechnet `verbrauch.ts`; hier stehen die
 * Komponenten und ihre Chargennummern.
 */

/**
 * Name der Komponente an dieser Stelle: A, B, C, D …
 *
 * Reaktionsharze kommen als zwei- bis vierkomponentiges Gebinde auf die
 * Baustelle, und jede Komponente hat ihre eigene Chargennummer. Die Buchstaben
 * stehen so auf den Gebinden.
 */
export function komponentenName(index: number): string {
  return `Komp. ${String.fromCharCode(65 + index)}`
}

/**
 * Chargen für Bericht und Liste.
 * Eine Komponente steht ohne Buchstaben da – „Charge A" wäre dort albern.
 */
export function chargenText(chargen: string[]): string {
  const eingetragen = chargen.map((charge) => charge.trim())
  const gefuellt = eingetragen.filter(Boolean)
  if (gefuellt.length === 0) return ''
  if (gefuellt.length === 1 && eingetragen.length === 1) return gefuellt[0]
  return eingetragen
    .map((charge, index) => (charge ? `${komponentenName(index)} ${charge}` : ''))
    .filter(Boolean)
    .join(' · ')
}
