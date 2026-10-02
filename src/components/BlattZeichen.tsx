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
  fertig: { zeichen: '✓', farbe: 'text-sika-gruen', wort: 'erledigt' },
  fehlt: { zeichen: '●', farbe: 'text-sika-gelb-dunkel', wort: 'Pflichtangabe fehlt noch' },
  warnung: { zeichen: '⚠', farbe: 'text-sika-rot', wort: 'Warnung' },
}

export function BlattZeichen({ art, klasse = '' }: { art: BlattStand; klasse?: string }) {
  // Ein leeres Blatt ohne Pflichtangaben bekommt gar kein Zeichen: drei Zeichen
  // kann man sich merken, ein viertes für „noch nichts drin" wäre nur Rauschen.
  if (art === 'neutral') return null

  const { zeichen, farbe, wort } = ZEICHEN[art]
  // `relative` hält den unsichtbaren Text (`sr-only` ist absolut positioniert)
  // im Zeichen fest. Ohne das entwischt er aus der waagerecht scrollenden
  // Reiterleiste und macht die ganze Seite auf dem Handy dreimal so breit.
  return (
    <span className={`relative ${farbe} ${klasse}`}>
      <span className="sr-only">{wort}: </span>
      <span aria-hidden>{zeichen}</span>
    </span>
  )
}
