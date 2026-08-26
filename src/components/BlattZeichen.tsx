import type { BlattStand } from '../lib/typen'

/**
 * Das Zeichen an Reiter und Kachel.
 *
 * Die Farben sind die der App: Gelb heißt „fehlt noch" und hält niemanden auf,
 * Rot bleibt der Gefahr vorbehalten – heute dem unterschrittenen Taupunkt.
 */
const ZEICHEN: Record<
  Exclude<BlattStand, 'neutral'>,
  { zeichen: string; farbe: string; wort: string }
> = {
  fertig: { zeichen: '✓', farbe: 'text-sika-gruen', wort: 'Pflichtangaben vollständig' },
  fehlt: { zeichen: '●', farbe: 'text-sika-gelb-dunkel', wort: 'Pflichtangabe fehlt noch' },
  warnung: { zeichen: '⚠', farbe: 'text-sika-rot', wort: 'Warnung' },
}

export function BlattZeichen({ art, klasse = '' }: { art: BlattStand; klasse?: string }) {
  // Blätter ohne Pflichtangaben bekommen gar kein Zeichen: drei Zeichen kann man
  // sich merken, ein viertes für „hier ist nichts zu holen" wäre nur Rauschen.
  if (art === 'neutral') return null

  const { zeichen, farbe, wort } = ZEICHEN[art]
  return (
    <span className={`${farbe} ${klasse}`}>
      <span className="sr-only">{wort}: </span>
      <span aria-hidden>{zeichen}</span>
    </span>
  )
}
